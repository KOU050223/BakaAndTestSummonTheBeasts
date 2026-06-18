module Api
  module Admin
    class UsersController < Api::BaseController
      before_action :authorize_school_admin!
      before_action :set_user, only: %i[update destroy]

      def index
        users = User.includes(:school_class).order(:id)
        users = users.where(role: params[:role]) if User::ROLES.include?(params[:role])

        render json: {
          users: users.map { |user| UserSerializer.new(user).as_json },
          stats: build_stats
        }, status: :ok
      end

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

      def update
        input = ::Admin::UpdateUserInput.new(update_user_params)
        unless input.valid?
          return render_error(
            code: "validation_error",
            message: "入力内容を確認してください",
            status: :unprocessable_entity,
            details: input.errors.to_hash
          )
        end

        result = ::Admin::UpdateUser.call(@user, input)
        render json: { user: UserSerializer.new(result[:user]).as_json }, status: :ok
      rescue ::Admin::UpdateUser::EmailTakenError
        render_error(code: "conflict", message: "このメールアドレスはすでに使用されています", status: :conflict)
      end

      def destroy
        if @user.id == current_user.id
          return render_error(code: "conflict", message: "自分自身は削除できません", status: :conflict)
        end

        @user.destroy!
        head :no_content
      rescue ActiveRecord::InvalidForeignKey
        # 試験・バトル・対戦ログなどの履歴に参照されているユーザーは
        # DBの外部キー制約で削除できない（exams.created_by_id 等は NOT NULL のため
        # nullify もできない）。500 ではなく 409 で意図を明示する。
        render_error(
          code: "conflict",
          message: "このユーザーは試験やバトルの履歴に紐づいているため削除できません",
          status: :conflict
        )
      end

      private

      def set_user
        @user = User.find_by(id: params[:id])
        render_error(code: "not_found", message: "ユーザーが見つかりません", status: :not_found) and return if @user.nil?
      end

      def create_user_params
        params.permit(:name, :email, :password, :role)
      end

      def update_user_params
        params.permit(:name, :email, :password, :role)
      end

      def build_stats
        counts = User.group(:role).count
        {
          student_count: counts["student"] || 0,
          teacher_count: counts["teacher"] || 0,
          admin_count: counts["school_admin"] || 0,
          total_count: User.count
        }
      end
    end
  end
end
