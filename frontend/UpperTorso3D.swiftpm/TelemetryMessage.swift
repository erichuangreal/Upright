import Foundation

struct TelemetryMessage: Codable {
    // meta
    let kind: String?          // "sample" | "event"
    let source: Int?           // 1 | 2
    let ts: Double?

    // posture / sample fields
    let pitch: Double?
    let pitch_smooth: Double?
    let roll: Double?

    let ax: Double?
    let ay: Double?
    let az: Double?

    let a_mag: Double?
    let dpitch: Double?
    let baseline_pitch: Double?

    // event fields
    let event: String?
    let button: Int?
    let button_click: Int?
}
