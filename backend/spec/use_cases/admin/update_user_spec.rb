require 'rails_helper'

RSpec.describe Admin::UpdateUser do
  let(:user) { create(:user, name: '旧名', email: 'old@example.com', role: 'student', password: 'password123') }

  def input_for(name: '新名', email: 'new@example.com', role: 'teacher', password: nil)
    Admin::UpdateUserInput.new(name: name, email: email, role: role, password: password)
  end

  it '名前・メール・ロールを更新する' do
    result = Admin::UpdateUser.call(user, input_for)

    expect(result[:user].name).to eq('新名')
    expect(result[:user].email).to eq('new@example.com')
    expect(result[:user].role).to eq('teacher')
  end

  it 'パスワード未指定なら既存パスワードを据え置く' do
    original_digest = user.password_digest
    Admin::UpdateUser.call(user, input_for(password: nil))

    expect(user.reload.password_digest).to eq(original_digest)
  end

  it 'パスワード指定時はパスワードを更新する' do
    original_digest = user.password_digest
    Admin::UpdateUser.call(user, input_for(password: 'newpassword123'))

    user.reload
    expect(user.password_digest).not_to eq(original_digest)
    expect(user.authenticate('newpassword123')).to be_truthy
  end

  it 'メールアドレスを正規化（小文字化・トリム）して保存する' do
    result = Admin::UpdateUser.call(user, input_for(email: '  NEW@Example.com  '))

    expect(result[:user].email).to eq('new@example.com')
  end

  it '他ユーザーが使用中のメールならEmailTakenErrorを発生させる' do
    create(:user, email: 'taken@example.com')

    expect {
      Admin::UpdateUser.call(user, input_for(email: 'taken@example.com'))
    }.to raise_error(Admin::UpdateUser::EmailTakenError)
  end

  it '自分自身の現在のメールはそのまま更新できる（重複判定の対象外）' do
    expect {
      Admin::UpdateUser.call(user, input_for(email: user.email, name: '改名のみ'))
    }.not_to raise_error

    expect(user.reload.name).to eq('改名のみ')
  end

  it '大文字違いだけの自分のメールも重複扱いしない' do
    expect {
      Admin::UpdateUser.call(user, input_for(email: user.email.upcase))
    }.not_to raise_error
  end
end
