require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'バリデーション' do
    it '有効なstudentユーザーを作成できる' do
      user = User.new(name: '山田太郎', email: 'yamada@example.com', password: 'password', role: 'student')
      expect(user).to be_valid
    end

    it 'nameが空では無効' do
      user = User.new(name: '', email: 'yamada@example.com', password: 'password', role: 'student')
      expect(user).not_to be_valid
    end

    it 'emailが空では無効' do
      user = User.new(name: '山田太郎', email: '', password: 'password', role: 'student')
      expect(user).not_to be_valid
    end

    it 'emailが重複していると無効' do
      User.create!(name: '先着', email: 'dup@example.com', password: 'password', role: 'student')
      user = User.new(name: '後着', email: 'dup@example.com', password: 'password', role: 'student')
      expect(user).not_to be_valid
    end

    it '大文字小文字違いのemailも重複として扱う' do
      User.create!(name: '先着', email: 'dup@example.com', password: 'password', role: 'student')
      user = User.new(name: '後着', email: 'DUP@EXAMPLE.COM', password: 'password', role: 'student')
      expect(user).not_to be_valid
    end

    it '保存時にemailが小文字に正規化される' do
      user = User.create!(name: 'テスト', email: 'UPPER@EXAMPLE.COM', password: 'password', role: 'student')
      expect(user.email).to eq('upper@example.com')
    end

    it '不正なメールフォーマットは無効' do
      %w[notanemail @missing-local.com user@].each do |bad_email|
        user = User.new(name: 'テスト', email: bad_email, password: 'password', role: 'student')
        expect(user).not_to be_valid, "#{bad_email} は無効のはずが valid になっています"
      end
    end

    it 'student / teacher / school_admin はすべて有効なrole' do
      %w[student teacher school_admin].each do |role|
        user = User.new(name: 'テスト', email: "role_#{role}@example.com", password: 'password', role: role)
        expect(user).to be_valid, "#{role} は有効のはずが invalid になっています"
      end
    end

    it '定義外のroleは無効' do
      user = User.new(name: 'テスト', email: 'test@example.com', password: 'password', role: 'admin')
      expect(user).not_to be_valid
    end
  end

  describe 'has_secure_password' do
    it '正しいパスワードで認証できる' do
      user = users(:student_one)
      expect(user.authenticate('password123')).to be_truthy
    end

    it '誤ったパスワードでは認証できない' do
      user = users(:student_one)
      expect(user.authenticate('wrongpassword')).to be_falsey
    end
  end
end
