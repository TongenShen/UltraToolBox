use serde::Serialize;
use std::process::Command;
use sysinfo::{Disks, System};

#[derive(Serialize)]
pub struct SystemInfo {
    pub cpu_brand: String,
    pub cpu_cores_physical: usize,
    pub cpu_cores_logical: usize,
    pub cpu_frequency: u64,
    pub cpu_usage: f32,
    pub architecture: String,
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub uptime_seconds: u64,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_available: u64,
    pub swap_total: u64,
    pub swap_used: u64,
    pub disks: Vec<DiskInfo>,
    pub process_count: usize,
    pub load_average_1: f64,
    pub load_average_5: f64,
    pub load_average_15: f64,
}

#[derive(Serialize)]
pub struct DiskInfo {
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub file_system: String,
}

#[derive(Serialize, Default)]
pub struct PowerInfo {
    pub available: bool,
    pub battery_percent: Option<f32>,
    pub battery_state: Option<String>,
    pub battery_time_remaining: Option<String>,
    pub power_source: Option<String>,
    pub thermal_level: Option<String>,
    pub cpu_power_mw: Option<u32>,
    pub gpu_power_mw: Option<u32>,
    pub combined_power_mw: Option<u32>,
    pub powermetrics_available: bool,
}

fn run_cmd(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
}

fn parse_power_info() -> PowerInfo {
    let os = std::env::consts::OS;
    if os != "macos" {
        return PowerInfo::default();
    }

    let mut info = PowerInfo {
        available: true,
        ..Default::default()
    };

    // 1. pmset -g batt — 电池信息
    if let Some(batt) = run_cmd("pmset", &["-g", "batt"]) {
        // 解析电源来源
        if batt.contains("AC Power") || batt.contains("Battery Power") {
            if batt.contains("AC Power") {
                info.power_source = Some("AC 电源".to_string());
            } else {
                info.power_source = Some("电池".to_string());
            }
        }
        // 解析电池百分比和状态
        for line in batt.lines() {
            if line.contains("InternalBattery") || line.contains("-Internal") {
                // 例如: -InternalBattery-0 (id=1234567) 75%; discharging; 4:32 remaining
                let trimmed = line.trim();
                if let Some(semicolon) = trimmed.find(';') {
                    let before = &trimmed[..semicolon];
                    let after = &trimmed[semicolon + 1..];
                    // 提取百分比
                    if let Some(pct_end) = before.find('%') {
                        let pct_str = before[..pct_end].trim();
                        // 从末尾往前找数字
                        if let Some(last_space) = pct_str.rfind(' ') {
                            if let Ok(pct) = pct_str[last_space + 1..].parse::<f32>() {
                                info.battery_percent = Some(pct);
                            }
                        }
                    }
                    // 提取状态 (charging/discharging/finishing charge/AC attached)
                    let state = after.trim().split(';').next().unwrap_or("").trim().to_string();
                    if !state.is_empty() {
                        info.battery_state = Some(state);
                    }
                    // 提取剩余时间
                    if after.contains("remaining") {
                        for part in after.split(';') {
                            let part = part.trim();
                            if part.contains("remaining") && !part.contains("no") {
                                info.battery_time_remaining = Some(part.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. pmset -g therm — 热压力
    if let Some(therm) = run_cmd("pmset", &["-g", "therm"]) {
        for line in therm.lines() {
            if line.contains("Thermal pressure") || line.contains("thermal pressure") {
                if let Some(colon) = line.find(':') {
                    info.thermal_level = Some(line[colon + 1..].trim().to_string());
                }
            }
        }
    }

    // 3. powermetrics — 功率信息 (可能需要 root, 捕获失败)
    if let Some(pm) = run_cmd(
        "powermetrics",
        &[
            "-s",
            "power",
            "-n",
            "1",
            "-i",
            "100",
            "--show-usage-summary",
        ],
    ) {
        info.powermetrics_available = true;
        for line in pm.lines() {
            let trimmed = line.trim();
            if let Some(val) = trimmed.strip_prefix("CPU Power:") {
                info.cpu_power_mw = parse_power_value(val.trim());
            } else if let Some(val) = trimmed.strip_prefix("GPU Power:") {
                info.gpu_power_mw = parse_power_value(val.trim());
            } else if let Some(val) = trimmed.strip_prefix("Combined Power:") {
                info.combined_power_mw = parse_power_value(val.trim());
            }
        }
    }

    info
}

fn parse_power_value(s: &str) -> Option<u32> {
    // 格式: "1234 mW" 或 "1234"
    let s = s.trim();
    if let Some(space) = s.find(' ') {
        s[..space].parse::<u32>().ok()
    } else {
        // 尝试直接解析
        s.parse::<u32>().ok()
    }
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    let sys = System::new_all();

    // CPU 信息
    let cpu = &sys.cpus()[0];
    let cpu_brand = cpu.brand().to_string();
    let cpu_cores_physical = sys.physical_core_count().unwrap_or(0);
    let cpu_cores_logical = sys.cpus().len();
    let cpu_frequency = cpu.frequency();
    let cpu_usage = sys.global_cpu_usage();

    // 架构
    let architecture = std::env::consts::ARCH.to_string();

    // 系统信息
    let hostname = System::host_name().unwrap_or_default();
    let os_name = System::name().unwrap_or_default();
    let os_version = System::os_version().unwrap_or_default();
    let kernel_version = System::kernel_version().unwrap_or_default();
    let uptime_seconds = System::uptime();

    // 内存
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_available = sys.available_memory();
    let swap_total = sys.total_swap();
    let swap_used = sys.used_swap();

    // 磁盘
    let disks: Vec<DiskInfo> = Disks::new_with_refreshed_list()
        .iter()
        .map(|d| DiskInfo {
            mount_point: d.mount_point().to_string_lossy().to_string(),
            total_space: d.total_space(),
            available_space: d.available_space(),
            file_system: d.file_system().to_string_lossy().to_string(),
        })
        .collect();

    // 进程数
    let process_count = sys.processes().len();

    // 负载
    let load_avg = System::load_average();
    let load_average_1 = load_avg.one;
    let load_average_5 = load_avg.five;
    let load_average_15 = load_avg.fifteen;

    SystemInfo {
        cpu_brand,
        cpu_cores_physical,
        cpu_cores_logical,
        cpu_frequency,
        cpu_usage,
        architecture,
        hostname,
        os_name,
        os_version,
        kernel_version,
        uptime_seconds,
        memory_total,
        memory_used,
        memory_available,
        swap_total,
        swap_used,
        disks,
        process_count,
        load_average_1,
        load_average_5,
        load_average_15,
    }
}

#[tauri::command]
fn get_power_info() -> PowerInfo {
    parse_power_info()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_info, get_power_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
