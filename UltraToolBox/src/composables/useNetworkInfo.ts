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
    const result = await executeCommand("route -n get default 2>/dev/null | grep interface | awk '{print $2}'")
    if (result.code === 0 && result.stdout.trim()) {
      return result.stdout.trim()
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
      // Fallback
      const fallback = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep "inet " | awk '{print $2}'`)
      if (fallback.code === 0) info.value.ipv4 = fallback.stdout.trim()
    }

    // IPv6 (skip link-local fe80::)
    const ipv6Result = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep "inet6" | grep -v fe80 | awk '{print $2}' | head -1`)
    if (ipv6Result.code === 0) info.value.ipv6 = ipv6Result.stdout.trim()

    // DNS
    const dnsResult = await executeCommand("scutil --dns 2>/dev/null | grep 'nameserver\\[' | awk '{print $3}' | sort -u")
    if (dnsResult.code === 0) {
      info.value.dnsServers = dnsResult.stdout.trim().split('\n').filter(s => s.trim())
    }

    // DHCP Server
    const dhcpResult = await executeCommand(`ipconfig getoption ${iface} server_identifier 2>/dev/null`)
    if (dhcpResult.code === 0) info.value.dhcpServer = dhcpResult.stdout.trim()

    // Gateway
    const gatewayResult = await executeCommand(`netstat -rn 2>/dev/null | grep default | grep ${iface} | awk '{print $2}' | head -1`)
    if (gatewayResult.code === 0) info.value.gateway = gatewayResult.stdout.trim()

    // Speed
    const speedResult = await executeCommand(`ifconfig ${iface} 2>/dev/null | grep media | awk '{print $2}'`)
    if (speedResult.code === 0) info.value.speed = speedResult.stdout.trim()
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