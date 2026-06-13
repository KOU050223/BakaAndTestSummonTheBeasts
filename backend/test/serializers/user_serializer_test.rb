require "test_helper"

class UserSerializerTest < ActiveSupport::TestCase
  setup do
    @user = users(:student_one)
  end

  test "必要なフィールドをJSON形式で返す" do
    json = UserSerializer.new(@user).as_json

    assert_equal @user.id, json[:id]
    assert_equal @user.name, json[:name]
    assert_equal @user.email, json[:email]
    assert_equal @user.role, json[:role]
    assert json[:created_at].present?
  end

  test "created_atはISO8601形式の文字列を返す" do
    json = UserSerializer.new(@user).as_json
    assert_match(/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, json[:created_at])
  end

  test "password_digestを含まない" do
    json = UserSerializer.new(@user).as_json
    assert_nil json[:password_digest]
  end
end
