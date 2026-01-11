import Foundation
import Combine

final class PostureViewModel: ObservableObject {

    // Sensor-driven posture
    @Published var upperPitch: Double = 0
    @Published var lowerPitch: Double = 0

    // Events
    @Published var lastEvent: String?

    private let ws = TelemetryWebSocket()

    func start() {
        ws.onMessage = { [weak self] msg in
            DispatchQueue.main.async {
                self?.handle(msg)
            }
        }
        ws.connect()
    }

    func stop() {
        ws.disconnect()
    }

    private func handle(_ msg: TelemetryMessage) {

        // Events
        if msg.kind == "event" {
            lastEvent = msg.event
            return
        }

        // Samples
        guard msg.kind == "sample",
              let pitch = msg.pitch else { return }

        if msg.source == 1 {
            upperPitch = pitch
        } else if msg.source == 2 {
            lowerPitch = pitch
        }
    }
}
