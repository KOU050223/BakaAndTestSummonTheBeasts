require "test_helper"

class Auth::LoginTest < ActiveSupport::TestCase
  setup do
    @user = users(:student_one)
  end

  test "正しい認証情報でtokenとuserを返す" do
    input = Auth::LoginInput.new(email: @user.email, password: "password123")
    result = Auth::Login.call(input)

    assert result[:token].present?
    assert_equal @user.id, result[:user].id
  end

  test "パスワードが誤りならAuthenticationErrorを発生させる" do
    input = Auth::LoginInput.new(email: @user.email, password: "wrong")
    assert_raises(Auth::Login::AuthenticationError) do
      Auth::Login.call(input)
    end
  end

  test "大文字小文字混在のメールアドレスでも認証できる" do
    input = Auth::LoginInput.new(email: "Student@EXAMPLE.com", password: "password123")
    result = Auth::Login.call(input)

    assert result[:token].present?
  end

  test "存在しないメールアドレスならAuthenticationErrorを発生させる" do
    input = Auth::LoginInput.new(email: "notexist@example.com", password: "password123")
    assert_raises(Auth::Login::AuthenticationError) do
      Auth::Login.call(input)
    end
  end
end
