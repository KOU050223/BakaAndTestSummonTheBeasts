require "test_helper"

class Api::AuthenticationTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:student_one)
  end

  test "有効なJWTトークンで認証が通る" do
    token = JwtService.encode(user_id: @user.id)

    get api_me_url, headers: { "Authorization" => "Bearer #{token}" }

    assert_response :ok
    assert_equal @user.id, JSON.parse(response.body)["id"]
  end

  test "Authorizationヘッダーなしでは401を返す" do
    get api_me_url

    assert_response :unauthorized
    assert_equal "認証が必要です", JSON.parse(response.body)["error"]
  end

  test "期限切れトークンでは401を返す" do
    expired_token = JWT.encode(
      { user_id: @user.id, exp: 1.hour.ago.to_i },
      JwtService::SECRET_KEY,
      "HS256"
    )

    get api_me_url, headers: { "Authorization" => "Bearer #{expired_token}" }

    assert_response :unauthorized
    assert_equal "認証トークンが無効です", JSON.parse(response.body)["error"]
  end

  test "改ざんされたトークンでは401を返す" do
    token = JwtService.encode(user_id: @user.id) + "tampered"

    get api_me_url, headers: { "Authorization" => "Bearer #{token}" }

    assert_response :unauthorized
    assert_equal "認証トークンが無効です", JSON.parse(response.body)["error"]
  end

  test "存在しないユーザーIDのトークンでは401を返す" do
    token = JwtService.encode(user_id: User.maximum(:id).to_i + 1)

    get api_me_url, headers: { "Authorization" => "Bearer #{token}" }

    assert_response :unauthorized
    assert_equal "ユーザーが見つかりません", JSON.parse(response.body)["error"]
  end

  test "Bearerプレフィックスなしのトークンでは401を返す" do
    token = JwtService.encode(user_id: @user.id)

    get api_me_url, headers: { "Authorization" => token }

    assert_response :unauthorized
  end
end
