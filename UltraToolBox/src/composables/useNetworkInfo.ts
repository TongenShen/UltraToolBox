import { ref } from 'vue'
import { executeCommand } from './useCommand'

export interface NetworkInfo {
  interfaceName: string
  ipv4: string
  ipv6: string
  dnsServers: string[]
  dhcpServer: string
  gateway: string
  speed: string
}

export function useNetworkInfo() {
  const info = ref<NetworkInfo>({
    interfaceName: '',
    ipv4: '',
    ipv6: '',
    dnsServers: [],
    dhcpServer: '',
    gateway: '',
    speed: ''
  })
  const loading = ref(true)
  const error = ref('')

  async function fetchInfo() {
    loading.value = true
    error.value = ''

    try {
      const platformResult = await executeCommand('uname -s')
      const platform = platformResult.stdout.trim()

      if (platform === 'Darwin') {
        await fetchMacInfo()
      } else if (platform === 'Linux') {
        await fetchLinuxInfo()
      } else {
        await fetchWindowsInfo()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function getActiveInterface(): Promise<string> {
    // 方法1: 使用 scutil --nwi 获取主接口 (macOS 最可靠)
    const scutilResult = await executeCommand("scutil --nwi 2>/dev/null | grep 'PrimaryInterface' | awk -F': ' '{print $2}' | tr -d ' '")
    if (scutilResult.code === 0) {
      const iface = scutilResult.stdout.trim()
      if (iface) {
        // 验证该接口有有效 IPv4 地址
        const checkIp = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | head -1`)
        if (checkIp.code === 0 && checkIp.stdout.trim()) {
          return iface
        }
      }
    }

    // 方法2: 遍历 en* 接口，找第一个有有效 IPv4 的物理接口
    const listResult = await executeCommand("ifconfig -l 2>/dev/null | tr ' ' '\\n' | grep '^en'")
    if (listResult.code === 0) {
      const interfaces = listResult.stdout.trim().split('\n').filter(s => s.trim())
      for (const iface of interfaces) {
        const checkIp = await executeCommand(`ifconfig ${iface.trim()} 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | head -1`)
        if (checkIp.code === 0 && checkIp.stdout.trim()) {
          return iface.trim()
        }
      }
    }

    return 'en0'
  }

  async function fetchMacInfo() {
    const iface = await getActiveInterface()
    info.value.interfaceName = iface

    // IPv4
    const ipv4Result = await executeCommand(`ipconfig getifaddr ${iface} 2>/dev/null`)
    if (ipv4Result.code === 0 && ipv4Result.stdout.trim()) {
      info.value.ipv4 = ipv4Result.stdout.trim()
    } else {
      const fallback = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}'`)
      if (fallback.code === 0) info.value.ipv4 = fallback.stdout.trim()
    }

    // IPv6 (skip link-local fe80::)
    const ipv6Result = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep 'inet6' | grep -v fe80 | awk '{print $2}' | head -1`)
    if (ipv6Result.code === 0) info.value.ipv6 = ipv6Result.stdout.trim()

    // DNS
    const dnsResult = await executeCommand("scutil --dns 2>/dev/null | grep 'nameserver\\[' | awk '{print $3}' | sort -u")
    if (dnsResult.code === 0) {
      info.value.dnsServers = dnsResult.stdout.trim().split('\n').filter(s => s.trim())
    }

    // DHCP Server - 通过 DHCP 获取
    const dhcpResult = await executeCommand(`ipconfig getoption ${iface} server_identifier 2>/dev/null`)
    if (dhcpResult.code === 0 && dhcpResult.stdout.trim()) {
      info.value.dhcpServer = dhcpResult.stdout.trim()
    }

    // Gateway - 优先从 DHCP 获取路由器地址，再回退路由表
    const gwDhcp = await executeCommand(`ipconfig getoption ${iface} router 2>/dev/null`)
    if (gwDhcp.code === 0 && gwDhcp.stdout.trim()) {
      info.value.gateway = gwDhcp.stdout.trim()
    } else {
      const gwRoute = await executeCommand("netstat -rn -f inet 2>/dev/null | grep '^default' | grep -v utun | awk '{print $2}' | head -1")
      if (gwRoute.code === 0 && gwRoute.stdout.trim() && !gwRoute.stdout.trim().startsWith('link#')) {
        info.value.gateway = gwRoute.stdout.trim()
      }
    }

    // Speed - 检测 WiFi 或 有线速率
    const wifiCheck = await executeCommand("airport -I 2>/dev/null | grep 'maxRate'")
    if (wifiCheck.code === 0 && wifiCheck.stdout.trim()) {
      // 优先 WiFi 实际协商速率
      const lastTxRate = await executeCommand("airport -I 2>/dev/null | grep 'lastTxRate' | awk '{print $2}'")
      if (lastTxRate.code === 0 && lastTxRate.stdout.trim()) {
        info.value.speed = lastTxRate.stdout.trim() + ' Mb/s'
      } else {
        const maxRate = wifiCheck.stdout.trim().split(':').pop()?.trim() || ''
        if (maxRate) info.value.speed = maxRate + ' Mb/s'
      }
    } else {
      // 有线速率
      const mediaResult = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep 'media:' | grep -oE '100base|1000base|2500base|5000base|10000base' | head -1`)
      if (mediaResult.code === 0 && mediaResult.stdout.trim()) {
        info.value.speed = mediaResult.stdout.trim() + 'T'
      }
    }
    // 如果 speed 为 none 或空，留空让 UI 显示"不可用"
  }

  async function fetchLinuxInfo() {
    // Linux: use `ip` commands
    const ifaceResult = await executeCommand("ip route show default 2>/dev/null | awk '{print $5}' | head -1")
    const iface = ifaceResult.stdout.trim() || 'eth0'
    info.value.interfaceName = iface

    // IPv4
    const ipv4Result = await executeCommand(`ip addr show ${iface} 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1 | head -1`)
    if (ipv4Result.code === 0) info.value.ipv4 = ipv4Result.stdout.trim()

    // IPv6
    const ipv6Result = await executeCommand(`ip addr show ${iface} 2>/dev/null | grep "inet6" | grep -v fe80 | awk '{print $2}' | cut -d/ -f1 | head -1`)
    if (ipv6Result.code === 0) info.value.ipv6 = ipv6Result.stdout.trim()

    // DNS
    const dnsResult = await executeCommand("resolvectl status 2>/dev/null | grep 'DNS Server' | awk '{print $NF}' || cat /etc/resolv.conf 2>/dev/null | grep nameserver | awk '{print $2}'")
    if (dnsResult.code === 0) {
      info.value.dnsServers = dnsResult.stdout.trim().split('\n').filter(s => s.trim())
    }

    // Gateway
    const gatewayResult = await executeCommand(`ip route show default 2>/dev/null | awk '{print $3}' | head -1`)
    if (gatewayResult.code === 0) info.value.gateway = gatewayResult.stdout.trim()

    // Speed
    const speedResult = await executeCommand(`cat /sys/class/net/${iface}/speed 2>/dev/null`)
    if (speedResult.code === 0 && speedResult.stdout.trim()) {
      info.value.speed = `${speedResult.stdout.trim()} Mb/s`
    }
  }

  async function fetchWindowsInfo() {
    const result = await executeCommand('ipconfig /all 2>nul')
    if (result.code === 0) {
      const lines = result.stdout.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.includes('IPv4') && line.includes(':')) {
          const match = line.match(/: ([\d.]+)/)
          if (match) info.value.ipv4 = match[1]
        }
        if (line.includes('DNS') && line.includes(':')) {
          const match = line.match(/: ([\d.]+)/)
          if (match) info.value.dnsServers.push(match[1])
        }
        if (line.includes('DHCP Server') && line.includes(':')) {
          const match = line.match(/: ([\d.]+)/)
          if (match) info.value.dhcpServer = match[1]
        }
        if (line.includes('Default Gateway') && line.includes(':')) {
          const match = line.match(/: ([\d.]+)/)
          if (match) info.value.gateway = match[1]
        }
        if (line.includes('Speed') || line.includes('速度')) {
          const match = line.match(/: (.+)$/)
          if (match) info.value.speed = match[1].trim()
        }
      }
    }
  }

  return { info, loading, error, fetchInfo }
}