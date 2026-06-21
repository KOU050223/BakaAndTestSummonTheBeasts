class AddLoserToBattles < ActiveRecord::Migration[8.1]
  def change
    add_reference :battles, :loser, foreign_key: { to_table: :users }
  end
end
