module Api
  class PushSubscriptionsController < BaseController
    # Push購読を登録または更新する。
    # endpoint が同一なら既存レコードを更新し、なければ新規作成する。
    def create
      sub = current_user.push_subscriptions.find_or_initialize_by(endpoint: params[:endpoint])
      sub.assign_attributes(
        p256dh_key: params[:p256dh],
        auth_key: params[:auth]
      )

      if sub.save
        render json: { ok: true }, status: :created
      else
        render_error(code: "invalid_request", message: sub.errors.full_messages.join(", "), status: :unprocessable_entity)
      end
    end

    # Push購読を解除する。
    def destroy
      sub = current_user.push_subscriptions.find_by(endpoint: params[:endpoint])
      sub&.destroy
      render json: { ok: true }, status: :ok
    end
  end
end
