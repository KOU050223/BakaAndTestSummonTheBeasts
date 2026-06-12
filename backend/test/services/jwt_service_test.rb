require "test_helper"

class JwtServiceTest < ActiveSupport::TestCase
  test "ペイロードをエンコードしてデコードできる" do
    payload = { user_id: 1 }
    token = JwtService.encode(payload)
    decoded = JwtService.decode(token)

    assert_equal 1, decoded["user_id"]
    assert_equal({ user_id: 1 }, payload)
  end

  test "エンコードしたトークンにexpが含まれる" do
    token = JwtService.encode({ user_id: 1 })
    decoded = JwtService.decode(token)

    assert decoded["exp"].present?
    assert decoded["exp"] > Time.now.to_i
  end

  test "有効期限は24時間後に設定される" do
    freeze_time do
      token = JwtService.encode({ user_id: 1 })
      decoded = JwtService.decode(token)

      expected_exp = 24.hours.from_now.to_i
      assert_in_delta expected_exp, decoded["exp"], 1
    end
  end

  test "期限切れトークンはnilを返す" do
    expired_token = JWT.encode(
      { user_id: 1, exp: 1.hour.ago.to_i },
      JwtService::SECRET_KEY,
      "HS256"
    )

    assert_nil JwtService.decode(expired_token)
  end

  test "改ざんされたトークンはnilを返す" do
    token = JwtService.encode({ user_id: 1 })
    tampered = token + "tampered"

    assert_nil JwtService.decode(tampered)
  end

  test "異なる秘密鍵で署名されたトークンはnilを返す" do
    fake_token = JWT.encode({ user_id: 1, exp: 1.hour.from_now.to_i }, "wrong_secret", "HS256")

    assert_nil JwtService.decode(fake_token)
  end

  test "空文字トークンはnilを返す" do
    assert_nil JwtService.decode("")
  end

  test "nilトークンはnilを返す" do
    assert_nil JwtService.decode(nil)
  end

  test "複数のペイロードフィールドを保持できる" do
    payload = { user_id: 42, role: "teacher" }
    token = JwtService.encode(payload)
    decoded = JwtService.decode(token)

    assert_equal 42, decoded["user_id"]
    assert_equal "teacher", decoded["role"]
  end
end
