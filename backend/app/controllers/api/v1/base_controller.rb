module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate!

      private

      def authenticate!
        header = request.headers["Authorization"]
        render json: { error: "認証が必要です" }, status: :unauthorized and return unless header&.start_with?("Bearer ")

        token = header.split(" ").last

        payload = JwtService.decode(token)
        render json: { error: "認証トークンが無効です" }, status: :unauthorized and return if payload.nil?

        @current_user = User.find_by(id: payload["user_id"])
        render json: { error: "ユーザーが見つかりません" }, status: :unauthorized if @current_user.nil?
      end

      def current_user
        @current_user
      end
    end
  end
end
