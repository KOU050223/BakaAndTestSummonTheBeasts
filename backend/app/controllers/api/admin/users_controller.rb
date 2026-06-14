module Api
  module Admin
    class UsersController < Api::BaseController
      before_action :authorize_school_admin!

      def create
        input = ::Admin::CreateUserInput.new(create_user_params)
        unless input.valid?
          return render_error(
            code: "validation_error",
            message: "入力内容を確認してください",
            status: :unprocessable_entity,
            details: input.errors.to_hash
          )
        end

        result = ::Admin::CreateUser.call(input)
        render json: { user: UserSerializer.new(result[:user]).as_json }, status: :created
      rescue ::Admin::CreateUser::EmailTakenError
        render_error(code: "conflict", message: "このメールアドレスはすでに使用されています", status: :conflict)
      end

      private

      def create_user_params
        params.permit(:name, :email, :password, :role)
      end
    end
  end
end
