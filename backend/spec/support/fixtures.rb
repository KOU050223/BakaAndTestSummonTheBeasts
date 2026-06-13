RSpec.shared_context 'with fixtures' do
  fixtures :all
end

RSpec.configure do |config|
  config.include_context 'with fixtures'
end
