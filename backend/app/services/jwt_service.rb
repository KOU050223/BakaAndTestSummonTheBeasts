class JwtService
  SECRET_KEY = Rails.application.secret_key_base
  EXPIRATION = 24.hours

  def self.encode(payload)
    payload[:exp] = EXPIRATION.from_now.to_i
    JWT.encode(payload, SECRET_KEY, "HS256")
  end

  def self.decode(token)
    return nil if token.blank?

    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })
    decoded.first
  rescue JWT::DecodeError
    nil
  end
end
