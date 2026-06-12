class JwtService
  SECRET_KEY = ENV.fetch("JWT_SECRET_KEY") { Rails.application.secret_key_base }
  EXPIRATION = 24.hours

  def self.encode(payload)
    JWT.encode(payload.merge(exp: EXPIRATION.from_now.to_i), SECRET_KEY, "HS256")
  end

  def self.decode(token)
    return nil if token.blank?

    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })
    decoded.first
  rescue JWT::DecodeError
    nil
  end
end
