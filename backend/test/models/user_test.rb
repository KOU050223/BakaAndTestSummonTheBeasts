require "test_helper"

class UserTest < ActiveSupport::TestCase
  # --- バリデーション ---

  test "有効なstudentユーザーを作成できる" do
    user = User.new(name: "山田太郎", email: "yamada@example.com", password: "password", role: "student")
    assert user.valid?
  end

  test "nameが空では無効" do
    user = User.new(name: "", email: "yamada@example.com", password: "password", role: "student")
    assert_not user.valid?
  end

  test "emailが空では無効" do
    user = User.new(name: "山田太郎", email: "", password: "password", role: "student")
    assert_not user.valid?
  end

  test "emailが重複していると無効" do
    User.create!(name: "先着", email: "dup@example.com", password: "password", role: "student")
    user = User.new(name: "後着", email: "dup@example.com", password: "password", role: "student")
    assert_not user.valid?
  end

  test "不正なメールフォーマットは無効" do
    %w[notanemail @missing-local.com user@].each do |bad_email|
      user = User.new(name: "テスト", email: bad_email, password: "password", role: "student")
      assert_not user.valid?, "#{bad_email} は無効のはずが valid になっています"
    end
  end

  test "student / teacher / school_admin はすべて有効なrole" do
    %w[student teacher school_admin].each do |role|
      user = User.new(name: "テスト", email: "role_#{role}@example.com", password: "password", role: role)
      assert user.valid?, "#{role} は有効のはずが invalid になっています"
    end
  end

  test "定義外のroleは無効" do
    user = User.new(name: "テスト", email: "test@example.com", password: "password", role: "admin")
    assert_not user.valid?
  end

  # --- has_secure_password ---

  test "正しいパスワードで認証できる" do
    user = users(:student_one)
    assert user.authenticate("password123")
  end

  test "誤ったパスワードでは認証できない" do
    user = users(:student_one)
    assert_not user.authenticate("wrongpassword")
  end
end
