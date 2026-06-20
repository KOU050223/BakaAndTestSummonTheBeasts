module Api
  module Admin
    class RankingsController < Api::BaseController
      before_action :authorize_school_admin!

      # GET /api/admin/rankings
      # Returns overall rankings aggregated by total score (descending)
      def index
        # Aggregate total score per student, joining school_class for display
        rows = Score.joins(student: :school_class)
                    .group("users.id", "users.name", "school_classes.id", "school_classes.name")
                    .select("users.id AS user_id, users.name AS user_name, school_classes.id AS class_id, school_classes.name AS class_name, SUM(score) AS total_score")
                    .order("SUM(score) DESC")

        rankings = rows.map.with_index(1) do |r, idx|
          {
            rank: idx,
            user_id: r.user_id,
            name: r.user_name,
            school_class: { id: r.class_id, name: r.class_name },
            total_score: r.total_score.to_f
          }
        end

        render json: { rankings: rankings }, status: :ok
      end
    end
  end
end
