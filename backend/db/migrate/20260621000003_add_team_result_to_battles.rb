class AddTeamResultToBattles < ActiveRecord::Migration[8.1]
  def change
    add_reference :battles, :winner_team, foreign_key: { to_table: :school_classes }
    add_reference :battles, :loser_team, foreign_key: { to_table: :school_classes }
  end
end
