module Internal
  # Go Game Server 専用 internal API の基底コントローラ。
  # 公開API(Api::BaseController)とは別系統。JWTではなく共有シークレットで認証する
  # （docs/backend-design.md §8）。Go と Rails のみが知る INTERNAL_API_SECRET を
  # X-Internal-Secret ヘッダで突き合わせ、タイミング安全比較で検証する。
  class BaseController < ActionController::API
    before_action :authenticate_internal!

    private

    def authenticate_internal!
      expected = ENV["INTERNAL_API_SECRET"]
      provided = request.headers["X-Internal-Secret"]

      if expected.blank?
        # シークレット未設定は構成ミス。誤って無認証で公開しないよう拒否する。
        return render json: { error: { code: "internal_secret_not_configured", message: "INTERNAL_API_SECRET is not set" } },
                      status: :service_unavailable
      end

      unless provided.present? && ActiveSupport::SecurityUtils.secure_compare(provided, expected)
        render json: { error: { code: "unauthorized", message: "invalid internal secret" } },
               status: :unauthorized
      end
    end
  end
end
