require 'rails_helper'

RSpec.describe Auth::LoginInput do
  it 'email・passwordが揃っていれば有効' do
    input = Auth::LoginInput.new(email: 'user@example.com', password: 'password123')
    expect(input).to be_valid
  end

  it 'emailが空なら無効' do
    input = Auth::LoginInput.new(email: '', password: 'password123')
    expect(input).not_to be_valid
    expect(input.errors[:email]).to include("can't be blank")
  end

  it 'passwordが空なら無効' do
    input = Auth::LoginInput.new(email: 'user@example.com', password: '')
    expect(input).not_to be_valid
    expect(input.errors[:password]).to include("can't be blank")
  end

  it 'emailはstring型にキャストされる' do
    input = Auth::LoginInput.new(email: 12345, password: 'pass')
    expect(input.email).to eq('12345')
  end
end
