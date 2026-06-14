module Api
  class BaseController < ActionController::API
    include Api::ErrorRenderable

    before_action :authenticate!

    private

    def authenticate!
      header = request.headers["Authorization"]
      render_error(code: "unauthorized", message: "認証が必要です", status: :unauthorized) and return unless header&.start_with?("Bearer ")

      token = header.split(" ").last

      payload = JwtService.decode(token)
      render_error(code: "unauthorized", message: "認証トークンが無効です", status: :unauthorized) and return if payload.nil?

      @current_user = User.find_by(id: payload["user_id"])
      render_error(code: "unauthorized", message: "ユーザーが見つかりません", status: :unauthorized) and return if @current_user.nil?
    end

    def current_user
      @current_user
    end

    def authorize_school_admin!
      render_error(code: "forbidden", message: "権限がありません", status: :forbidden) and return unless current_user&.role == "school_admin"
    end

    def require_role!(*roles)
      render_error(code: "forbidden", message: "権限がありません", status: :forbidden) and return unless roles.map(&:to_s).include?(current_user&.role)
    end
  end
end
