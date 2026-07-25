use serde::Serialize;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
