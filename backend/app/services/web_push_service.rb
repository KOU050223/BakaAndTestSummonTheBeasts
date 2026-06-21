class WebPushService
  def self.notify_user(user:, title:, body:, url: "/wars")
    new(user: user, title: title, body: body, url: url).call
  end

  def initialize(user:, title:, body:, url:)
    @user = user
    @title = title
    @body = body
    @url = url
  end

  def call
    return unless vapid_configured?

    @user.push_subscriptions.find_each do |sub|
      send_notification(sub)
    end
  end

  private

  def send_notification(sub)
    WebPush.payload_send(
      message: JSON.generate({ title: @title, body: @body, url: @url }),
      endpoint: sub.endpoint,
      p256dh: sub.p256dh_key,
      auth: sub.auth_key,
      vapid: {
        subject: "mailto:#{ENV.fetch('VAPID_CONTACT_EMAIL', 'admin@example.com')}",
        public_key: ENV.fetch("VAPID_PUBLIC_KEY"),
        private_key: ENV.fetch("VAPID_PRIVATE_KEY")
      },
      ssl_timeout: 5,
      open_timeout: 5,
      read_timeout: 5
    )
  rescue WebPush::ExpiredSubscription, WebPush::InvalidSubscription
    sub.destroy
  rescue => e
    Rails.logger.error("[WebPushService] Failed to send to #{sub.endpoint}: #{e.message}")
  end

  def vapid_configured?
    ENV["VAPID_PUBLIC_KEY"].present? && ENV["VAPID_PRIVATE_KEY"].present?
  end
end
