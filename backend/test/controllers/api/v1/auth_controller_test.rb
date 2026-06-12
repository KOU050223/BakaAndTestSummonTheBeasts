require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  test "正しい認証情報でログインできる" do
    post api_v1_auth_login_url,
      params: { email: "student@example.com", password: "password123" },
      as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert json["token"].present?
    assert_equal "student@example.com", json["user"]["email"]
    assert_equal "student", json["user"]["role"]
  end

  test "誤ったパスワードではログインできない" do
    post api_v1_auth_login_url,
      params: { email: "student@example.com", password: "wrongpassword" },
      as: :json

    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "存在しないメールアドレスではログインできない" do
    post api_v1_auth_login_url,
      params: { email: "notexist@example.com", password: "password123" },
      as: :json

    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert json["error"].present?
  end
end
