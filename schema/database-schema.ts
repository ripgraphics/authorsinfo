table_name,column_name,data_type
activities,id,uuid
activities,user_id,uuid
activities,activity_type,text
activities,book_id,integer
activities,review_id,uuid
activities,list_id,uuid
activities,data,jsonb
activities,created_at,timestamp with time zone
album_images,album_id,uuid
album_images,image_id,integer
album_images,display_order,integer
album_images,created_at,timestamp with time zone
authors,id,integer
authors,name,character varying
authors,bio,text
authors,featured,boolean
authors,birth_date,date
authors,nationality,character varying
authors,website,text
authors,author_image_id,integer
authors,author_gallery_id,integer
authors,twitter_handle,text
authors,facebook_handle,text
authors,instagram_handle,text
authors,goodreads_url,text
authors,cover_image_id,integer
binding_types,id,integer
binding_types,name,character varying
binding_types,description,text
binding_types,created_at,timestamp with time zone
binding_types,updated_at,timestamp with time zone
book_authors,id,integer
book_authors,book_id,integer
book_authors,author_id,integer
book_authors,created_at,timestamp with time zone
book_club_books,id,uuid
book_club_books,book_club_id,uuid
book_club_books,book_id,integer
book_club_books,status,character varying
book_club_books,start_date,date
book_club_books,end_date,date
book_club_books,created_at,timestamp with time zone
book_club_books,created_by,uuid
book_club_discussion_comments,id,uuid
book_club_discussion_comments,discussion_id,uuid
book_club_discussion_comments,content,text
book_club_discussion_comments,created_by,uuid
book_club_discussion_comments,created_at,timestamp with time zone
book_club_discussion_comments,updated_at,timestamp with time zone
book_club_discussions,id,uuid
book_club_discussions,book_club_id,uuid
book_club_discussions,title,character varying
book_club_discussions,content,text
book_club_discussions,created_by,uuid
book_club_discussions,created_at,timestamp with time zone
book_club_discussions,updated_at,timestamp with time zone
book_club_discussions,book_id,integer
book_club_discussions,is_pinned,boolean
book_club_members,id,uuid
book_club_members,book_club_id,uuid
book_club_members,user_id,uuid
book_club_members,joined_at,timestamp with time zone
book_club_members,role,character varying
book_clubs,id,uuid
book_clubs,name,character varying
book_clubs,description,text
book_clubs,cover_image_url,text
book_clubs,created_by,uuid
book_clubs,created_at,timestamp with time zone
book_clubs,updated_at,timestamp with time zone
book_clubs,is_private,boolean
book_clubs,current_book_id,integer
book_clubs,member_count,integer
book_discussions,id,uuid
book_discussions,book_id,integer
book_discussions,user_id,uuid
book_discussions,title,text
book_discussions,content,text
book_discussions,is_pinned,boolean
book_discussions,created_at,timestamp with time zone
book_discussions,updated_at,timestamp with time zone
book_genre_mappings,id,integer
book_genre_mappings,book_id,integer
book_genre_mappings,genre_id,integer
book_genres,id,integer
book_genres,name,text
book_genres,description,text
book_genres,created_at,timestamp with time zone
book_publishers,id,integer
book_publishers,book_id,integer
book_publishers,publisher_id,integer
book_publishers,created_at,timestamp with time zone
book_recommendations,id,uuid
book_recommendations,user_id,uuid
book_recommendations,book_id,integer
book_recommendations,source_type,text
book_recommendations,source_book_id,integer
book_recommendations,score,double precision
book_recommendations,created_at,timestamp with time zone
book_recommendations,updated_at,timestamp with time zone
book_reviews,id,uuid
book_reviews,user_id,uuid
book_reviews,book_id,integer
book_reviews,rating,integer
book_reviews,review_text,text
book_reviews,created_at,timestamp with time zone
book_reviews,updated_at,timestamp with time zone
book_reviews,contains_spoilers,boolean
book_similarity_scores,id,bigint
book_similarity_scores,book_id,bigint
book_similarity_scores,similar_book_id,bigint
book_similarity_scores,similarity_score,double precision
book_similarity_scores,created_at,timestamp with time zone
book_subjects,id,integer
book_subjects,book_id,integer
book_subjects,subject_id,integer
book_tag_mappings,id,integer
book_tag_mappings,book_id,integer
book_tag_mappings,tag_id,integer
book_tags,id,integer
book_tags,name,text
book_tags,created_at,timestamp with time zone
book_views,id,uuid
book_views,user_id,uuid
book_views,book_id,bigint
book_views,viewed_at,timestamp with time zone
books,id,integer
books,isbn10,character varying
books,isbn13,character varying
books,title,character varying
books,title_long,text
books,publisher_id,integer
books,publication_date,date
books,binding,character varying
books,pages,integer
books,list_price,numeric
books,language,character varying
books,edition,character varying
books,synopsis,text
books,overview,text
books,dimensions,character varying
books,weight,numeric
books,cover_image_id,integer
books,original_image_url,text
books,author,character varying
books,featured,boolean
books,author_id,integer
books,book_gallery_img,ARRAY
books,average_rating,numeric
books,review_count,integer
books,binding_type_id,integer
books,format_type_id,integer
carousel_images,id,integer
carousel_images,carousel_name,character varying
carousel_images,image_url,text
carousel_images,alt_text,character varying
carousel_images,position,integer
carousel_images,active,boolean
countries,id,integer
countries,name,character varying
countries,code,character varying
countries,phone_code,character varying
countries,continent,character varying
countries,created_at,timestamp with time zone
countries,updated_at,timestamp with time zone
discussion_comments,id,uuid
discussion_comments,discussion_id,uuid
discussion_comments,user_id,uuid
discussion_comments,content,text
discussion_comments,created_at,timestamp with time zone
discussion_comments,updated_at,timestamp with time zone
follows,id,uuid
follows,follower_id,uuid
follows,following_id,uuid
follows,created_at,timestamp with time zone
format_types,id,integer
format_types,name,character varying
format_types,description,text
format_types,created_at,timestamp with time zone
format_types,updated_at,timestamp with time zone
group_members,id,uuid
group_members,group_id,uuid
group_members,user_id,uuid
group_members,joined_at,timestamp with time zone
group_members,role,character varying
groups,id,uuid
groups,name,character varying
groups,description,text
groups,is_public,boolean
groups,created_by,uuid
groups,created_at,timestamp with time zone
groups,updated_at,timestamp with time zone
image_types,id,integer
image_types,name,character varying
image_types,description,text
images,id,integer
images,url,text
images,alt_text,character varying
images,img_type_id,integer
list_followers,id,uuid
list_followers,user_id,uuid
list_followers,list_id,uuid
list_followers,created_at,timestamp with time zone
notifications,id,uuid
notifications,user_id,uuid
notifications,type,text
notifications,title,text
notifications,message,text
notifications,link,text
notifications,data,jsonb
notifications,is_read,boolean
notifications,created_at,timestamp with time zone
personalized_recommendations,id,uuid
personalized_recommendations,user_id,uuid
personalized_recommendations,book_id,bigint
personalized_recommendations,recommendation_type,text
personalized_recommendations,score,double precision
personalized_recommendations,explanation,text
personalized_recommendations,is_dismissed,boolean
personalized_recommendations,created_at,timestamp with time zone
personalized_recommendations,updated_at,timestamp with time zone
personalized_recommendations_with_details,id,uuid
personalized_recommendations_with_details,user_id,uuid
personalized_recommendations_with_details,book_id,bigint
personalized_recommendations_with_details,recommendation_type,text
personalized_recommendations_with_details,score,double precision
personalized_recommendations_with_details,explanation,text
personalized_recommendations_with_details,is_dismissed,boolean
personalized_recommendations_with_details,created_at,timestamp with time zone
personalized_recommendations_with_details,updated_at,timestamp with time zone
personalized_recommendations_with_details,title,character varying
personalized_recommendations_with_details,author,character varying
personalized_recommendations_with_details,cover_image_id,integer
personalized_recommendations_with_details,average_rating,numeric
personalized_recommendations_with_details,review_count,integer
photo_album,id,uuid
photo_album,entity_id,integer
photo_album,entity_type,character varying
photo_album,image_type_id,integer
photo_album,name,character varying
photo_album,description,text
photo_album,created_at,timestamp with time zone
photo_album,updated_at,timestamp with time zone
prices,id,integer
prices,book_id,integer
prices,condition,character varying
prices,merchant,character varying
prices,price,numeric
prices,total,numeric
prices,link,text
profiles,id,integer
profiles,user_id,uuid
profiles,bio,text
profiles,created_at,timestamp with time zone
profiles,updated_at,timestamp with time zone
publisher_countries,publisher_id,integer
publisher_countries,publisher_name,character varying
publisher_countries,original_country,character varying
publisher_countries,country_id,integer
publisher_countries,country_name,character varying
publisher_countries,country_code,character varying
publishers,id,integer
publishers,name,character varying
publishers,featured,boolean
publishers,website,character varying
publishers,email,character varying
publishers,phone,character varying
publishers,address_line1,character varying
publishers,address_line2,character varying
publishers,city,character varying
publishers,state,character varying
publishers,postal_code,character varying
publishers,country,character varying
publishers,about,text
publishers,cover_image_id,integer
publishers,publisher_image_id,integer
publishers,publisher_gallery_id,integer
publishers,founded_year,integer
publishers,country_id,integer
reading_challenges,id,uuid
reading_challenges,user_id,uuid
reading_challenges,year,integer
reading_challenges,target_books,integer
reading_challenges,books_read,integer
reading_challenges,created_at,timestamp with time zone
reading_challenges,updated_at,timestamp with time zone
reading_goals,id,uuid
reading_goals,user_id,uuid
reading_goals,goal_type,text
reading_goals,target_value,integer
reading_goals,start_date,date
reading_goals,end_date,date
reading_goals,current_value,integer
reading_goals,is_completed,boolean
reading_goals,created_at,timestamp with time zone
reading_goals,updated_at,timestamp with time zone
reading_list_items,id,uuid
reading_list_items,list_id,uuid
reading_list_items,book_id,integer
reading_list_items,added_at,timestamp with time zone
reading_list_items,notes,text
reading_lists,id,uuid
reading_lists,user_id,uuid
reading_lists,name,character varying
reading_lists,description,text
reading_lists,is_public,boolean
reading_lists,created_at,timestamp with time zone
reading_lists,updated_at,timestamp with time zone
reading_progress,id,uuid
reading_progress,user_id,uuid
reading_progress,book_id,integer
reading_progress,status,text
reading_progress,progress_percentage,integer
reading_progress,start_date,timestamp with time zone
reading_progress,finish_date,timestamp with time zone
reading_progress,created_at,timestamp with time zone
reading_progress,updated_at,timestamp with time zone
reading_sessions,id,uuid
reading_sessions,user_id,uuid
reading_sessions,book_id,integer
reading_sessions,start_time,timestamp with time zone
reading_sessions,end_time,timestamp with time zone
reading_sessions,pages_read,integer
reading_sessions,minutes_spent,integer
reading_sessions,notes,text
reading_sessions,created_at,timestamp with time zone
reading_stats_daily,id,uuid
reading_stats_daily,user_id,uuid
reading_stats_daily,date,date
reading_stats_daily,total_pages,integer
reading_stats_daily,total_minutes,integer
reading_stats_daily,books_read,integer
reading_stats_daily,books_started,integer
reading_stats_daily,books_finished,integer
reading_stats_daily,created_at,timestamp with time zone
reading_stats_daily,updated_at,timestamp with time zone
reading_streaks,id,uuid
reading_streaks,user_id,uuid
reading_streaks,start_date,date
reading_streaks,end_date,date
reading_streaks,days,integer
reading_streaks,is_active,boolean
reading_streaks,created_at,timestamp with time zone
reading_streaks,updated_at,timestamp with time zone
review_likes,id,uuid
review_likes,user_id,uuid
review_likes,review_id,uuid
review_likes,created_at,timestamp with time zone
reviews,id,integer
reviews,book_id,integer
reviews,review,text
roles,id,integer
roles,name,character varying
similar_books,id,integer
similar_books,book_id,integer
similar_books,similar_book_id,integer
similar_books,similarity_score,double precision
similar_books,created_at,timestamp with time zone
subjects,id,integer
subjects,name,character varying
subjects,parent_id,integer
sync_state,id,uuid
sync_state,type,text
sync_state,last_synced_date,timestamp with time zone
sync_state,current_page,integer
sync_state,total_books,integer
sync_state,processed_books,integer
sync_state,status,text
sync_state,error,text
sync_state,created_at,timestamp with time zone
sync_state,updated_at,timestamp with time zone
user_book_interactions,id,uuid
user_book_interactions,user_id,uuid
user_book_interactions,book_id,bigint
user_book_interactions,interaction_type,text
user_book_interactions,interaction_value,double precision
user_book_interactions,created_at,timestamp with time zone
user_reading_preferences,id,uuid
user_reading_preferences,user_id,uuid
user_reading_preferences,favorite_genres,ARRAY
user_reading_preferences,favorite_authors,ARRAY
user_reading_preferences,disliked_genres,ARRAY
user_reading_preferences,preferred_length,text
user_reading_preferences,preferred_complexity,text
user_reading_preferences,preferred_publication_era,text
user_reading_preferences,created_at,timestamp with time zone
user_reading_preferences,updated_at,timestamp with time zone
users,id,uuid
users,email,character varying
users,name,character varying
users,role_id,integer
users,created_at,timestamp with time zone
users,updated_at,timestamp with time zone