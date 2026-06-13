require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'バリデーション' do
    it '有効なstudentユーザーを作成できる' do
      user = build(:user, name: '山田太郎', email: 'yamada@example.com', role: 'student')
      expect(user).to be_valid
    end

    it 'nameが空では無効' do
      expect(build(:user, name: '')).not_to be_valid
    end

    it 'emailが空では無効' do
      expect(build(:user, email: '')).not_to be_valid
    end

    it 'emailが重複していると無効' do
      create(:user, email: 'dup@example.com')
      expect(build(:user, email: 'dup@example.com')).not_to be_valid
    end

    it '大文字小文字違いのemailも重複として扱う' do
      create(:user, email: 'dup@example.com')
      expect(build(:user, email: 'DUP@EXAMPLE.COM')).not_to be_valid
    end

    it '保存時にemailが小文字に正規化される' do
      user = create(:user, email: 'UPPER@EXAMPLE.COM')
      expect(user.email).to eq('upper@example.com')
    end

    it '不正なメールフォーマットは無効' do
      %w[notanemail @missing-local.com user@].each do |bad_email|
        expect(build(:user, email: bad_email)).not_to be_valid,
          "#{bad_email} は無効のはずが valid になっています"
      end
    end

    it 'student / teacher / school_admin はすべて有効なrole' do
      %w[student teacher school_admin].each do |role|
        expect(build(:user, role: role)).to be_valid,
          "#{role} は有効のはずが invalid になっています"
      end
    end

    it '定義外のroleは無効' do
      expect(build(:user, role: 'admin')).not_to be_valid
    end
  end

  describe 'has_secure_password' do
    let(:user) { create(:user, password: 'password123') }

    it '正しいパスワードで認証できる' do
      expect(user.authenticate('password123')).to be_truthy
    end

    it '誤ったパスワードでは認証できない' do
      expect(user.authenticate('wrongpassword')).to be_falsey
    end
  end
end
