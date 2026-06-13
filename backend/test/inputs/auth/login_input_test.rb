require "test_helper"

class Auth::LoginInputTest < ActiveSupport::TestCase
  test "email・passwordが揃っていれば有効" do
    input = Auth::LoginInput.new(email: "user@example.com", password: "password123")
    assert input.valid?
  end

  test "emailが空なら無効" do
    input = Auth::LoginInput.new(email: "", password: "password123")
    assert_not input.valid?
    assert_includes input.errors[:email], "can't be blank"
  end

  test "passwordが空なら無効" do
    input = Auth::LoginInput.new(email: "user@example.com", password: "")
    assert_not input.valid?
    assert_includes input.errors[:password], "can't be blank"
  end

  test "emailはstring型にキャストされる" do
    input = Auth::LoginInput.new(email: 12345, password: "pass")
    assert_equal "12345", input.email
  end
end
