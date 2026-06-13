module Internal
  # Go Game Server 専用 internal API の基底コントローラ。
  # 公開API(Api::BaseController)とは別系統。JWTではなく共有シークレットで認証する想定。
  # TODO: 共有シークレット認証を実装する（docs/backend-design.md §8）。
  class BaseController < ActionController::API
  end
end
