import Foundation

final class TelemetryWebSocket {

    private var socket: URLSessionWebSocketTask?
    private let decoder = JSONDecoder()

    var onMessage: ((TelemetryMessage) -> Void)?

    func connect() {
        // CHANGE IP IF BACKEND IS ON ANOTHER MACHINE
        let url = URL(string: "ws://192.168.1.42:8080")!
        socket = URLSession.shared.webSocketTask(with: url)
        socket?.resume()
        listen()
    }

    func disconnect() {
        socket?.cancel(with: .goingAway, reason: nil)
    }

    private func listen() {
        socket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                if case .string(let text) = message,
                   let data = text.data(using: .utf8),
                   let decoded = try? self?.decoder.decode(TelemetryMessage.self, from: data) {
                    self?.onMessage?(decoded)
                }
            case .failure(let error):
                print("WebSocket error:", error)
            }
            self?.listen()
        }
    }
}
