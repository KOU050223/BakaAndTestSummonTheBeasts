require 'rails_helper'

RSpec.describe Auth::Login do
  let(:user) { create(:user, email: 'login@example.com', password: 'password123') }

  it '正しい認証情報でtokenとuserを返す' do
    input = Auth::LoginInput.new(email: user.email, password: 'password123')
    result = Auth::Login.call(input)

    expect(result[:token]).to be_present
    expect(result[:user].id).to eq(user.id)
  end

  it 'パスワードが誤りならAuthenticationErrorを発生させる' do
    input = Auth::LoginInput.new(email: user.email, password: 'wrong')
    expect { Auth::Login.call(input) }.to raise_error(Auth::Login::AuthenticationError)
  end

  it '大文字小文字混在のメールアドレスでも認証できる' do
    input = Auth::LoginInput.new(email: user.email.upcase, password: 'password123')
    result = Auth::Login.call(input)

    expect(result[:token]).to be_present
  end

  it '存在しないメールアドレスならAuthenticationErrorを発生させる' do
    input = Auth::LoginInput.new(email: 'notexist@example.com', password: 'password123')
    expect { Auth::Login.call(input) }.to raise_error(Auth::Login::AuthenticationError)
  end
end
