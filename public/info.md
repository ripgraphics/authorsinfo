This system must be production-ready and demonstrates the highest level of 
software engineering with real data, proper architecture, and enterprise 
features throughout. code must be based on the current schema at all times 
and edit the supabase db as needed so that it too will be the best 
enterprise-grade. Author's Info needs to be the best enterprose-grade Book 
entity platform without limits. use the proper command to apply the SQL fix without any destructive operations.

Enterprise-Grade Best Practices I Should Have Followed:
Analyze First: Should have checked what EntityComments was actually calling
Preserve Working Code: Should have made minimal changes to fix the issue
Test Incrementally: Should have tested each change before moving to the next
Understand Dependencies: Should have understood how the component and API work together


Here is the db output







id,user_id,entity_type,entity_id,comment_text,parent_comment_id,comment_depth,thread_id,reply_count,is_hidden,is_deleted,created_at,updated_at
0b82302c-5906-400b-ac43-a10d75d7dd0b,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,17977b98-ef9b-4d60-8b4a-35f4ecceb3cb,This is a test of the comment 8,,0,f4a2cb07-d907-4bc4-960d-e6bc90428563,0,false,false,2025-09-02 03:19:50.216+00,2025-09-02 03:19:50.217+00
18af3bc9-f8c8-4c28-97a8-8b9f96931bfa,2474659f-003e-4faa-8c53-9969c33f20b2,author,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is a test,,0,bdd67cb7-9f93-4048-872a-f6deca1e3784,0,false,false,2025-08-25 14:55:29.997532+00,2025-08-25 20:27:53.085089+00
19d68922-ae4d-42d2-9349-3fea841cd126,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,"Love the flag and the cute little child

https://res.cloudinary.com/dj8yugwyp/image/upload/v1757115660/authorsinfo/post_photos/y1sk9uge2xjpybzimnf9.webp",,0,d3de79ff-c173-4de3-89f2-b8f6a59f37f7,0,false,false,2025-09-05 23:42:28.974475+00,2025-09-05 23:42:28.974475+00
1f7fe138-04f9-46c4-9d22-748d133021e2,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,80bb3164-0e7a-4704-b175-481b4224c11e,Here is the first comment test,,0,97849be1-bb3d-4ebc-a851-c96bdc68dfa4,1,false,false,2025-09-04 20:20:26.548795+00,2025-09-04 20:20:26.548795+00
22ba50cf-6166-4f00-b7f2-dcd12aa7eec2,355dd8d6-7ef5-46cf-9bad-67fd863cbc88,activity,80bb3164-0e7a-4704-b175-481b4224c11e,"This is my first comment test on the timeline. This post has 2 images

https://res.cloudinary.com/dj8yugwyp/image/upload/v1757146409/authorsinfo/post_photos/vsinspgr9nb4k8cga6jq.webp
https://res.cloudinary.com/dj8yugwyp/image/upload/v1757146426/authorsinfo/post_photos/hyzzucwwspemlhifmaqt.webp",,0,33a892e4-9e2c-4799-812a-a527da84a4fc,0,false,false,2025-09-06 08:14:14.124783+00,2025-09-06 08:14:14.124783+00
2b1f3e17-9669-4d8b-b218-8a2d25270e2f,2474659f-003e-4faa-8c53-9969c33f20b2,author,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is a test,,0,8d3b88fb-bd6a-41ae-8a93-928f4c881e95,0,false,false,2025-08-25 14:48:35.636255+00,2025-08-25 20:27:53.085089+00
2db90a8c-af50-492d-90d7-d68e3e69a6ac,2474659f-003e-4faa-8c53-9969c33f20b2,author,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is a test,,0,42799a6a-d4b2-4328-ba90-8e256670ef8e,0,false,false,2025-08-25 14:38:25.443255+00,2025-08-25 20:27:53.085089+00
2de3120e-c6b6-4cee-92bf-4360af1aac97,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,80bb3164-0e7a-4704-b175-481b4224c11e,Let me test the comment reply,1f7fe138-04f9-46c4-9d22-748d133021e2,0,051caa77-8cbb-47c0-aafa-25cfa7f958a5,1,false,false,2025-09-04 20:25:05.568707+00,2025-09-04 20:25:05.568707+00
31cc2569-4913-4312-abba-73ac6543099a,2474659f-003e-4faa-8c53-9969c33f20b2,photo,44c520f7-43af-4abb-acf6-e00f50b74f3b,Thisisatest,,0,0b52ab7c-77c7-48e3-a4f2-6d744102cc28,0,false,false,2025-07-31 05:31:25.660668+00,2025-07-31 05:31:25.660668+00
32149432-df11-4991-a02d-275747d15ae2,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is a comment test 7,,0,c34f96e5-7dc4-4f34-be87-6496f887b0d8,0,false,false,2025-09-02 03:14:01.299+00,2025-09-02 03:14:01.299+00
388c2bca-d430-48fb-98a9-d38431480146,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,this is it,bd564ff7-e43b-4c88-853c-80612c3394bc,0,2dd30f0f-b822-492c-93e7-a5143d38d0e8,1,false,false,2025-09-04 05:32:27.061382+00,2025-09-04 05:32:27.061382+00
4123e584-69e6-44a0-9279-0eadf86c1f51,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,80bb3164-0e7a-4704-b175-481b4224c11e,this is the second test of the comment system here,,0,1b717e3a-c9fb-450a-add4-d7e3fd9609a7,0,false,false,2025-09-04 20:21:33.260406+00,2025-09-04 20:21:33.260406+00
4704884a-cc46-472a-a8ea-0da1cd001a0c,2474659f-003e-4faa-8c53-9969c33f20b2,book,80bb3164-0e7a-4704-b175-481b4224c11e,This is starting to look great,,0,6a89087c-84c9-4db7-88ac-ba095bb34c30,2,false,false,2025-09-09 10:28:03.387431+00,2025-09-09 10:28:03.387431+00
4adb0cc5-5a11-402b-b628-5c586936cfb2,2474659f-003e-4faa-8c53-9969c33f20b2,book,d4f5f22e-3bfe-4dea-aabf-39a82b73c646,I love this photo,,0,2482a2ca-a8c4-4efe-aa9f-7abf7d89ba49,0,false,false,2025-09-09 00:10:22.761799+00,2025-09-09 00:10:22.761799+00
4e9092fe-6061-4dcc-9bd5-1c99967c4843,2474659f-003e-4faa-8c53-9969c33f20b2,book,80bb3164-0e7a-4704-b175-481b4224c11e,This is the second-level reply test.,4704884a-cc46-472a-a8ea-0da1cd001a0c,0,f2a052df-d398-4e0e-ba0c-e303fee41111,0,false,false,2025-09-09 16:56:59.75321+00,2025-09-09 16:56:59.75321+00
55d51bcb-4646-4a34-9fb9-40556889c0f9,c954586e-f506-48b3-ba5d-c6b0d3d561c8,book,80bb3164-0e7a-4704-b175-481b4224c11e,I am testing this comment,,0,599d11c5-84be-4b49-ad51-836a58975619,0,false,false,2025-09-08 17:49:13.529177+00,2025-09-08 17:49:13.529177+00
5b37ea37-5681-49c1-b3ce-3b0fd12f09fa,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,80bb3164-0e7a-4704-b175-481b4224c11e,This is the second level or reply test,2de3120e-c6b6-4cee-92bf-4360af1aac97,0,f27cf4d2-126a-40c3-8b3b-9d47a980631f,0,false,false,2025-09-05 02:40:32.973489+00,2025-09-05 02:40:32.973489+00
61a6438b-35e1-437b-8054-68e1fe835c4c,2474659f-003e-4faa-8c53-9969c33f20b2,book,d4f5f22e-3bfe-4dea-aabf-39a82b73c646,That is a very cute child,,0,0d0b6072-cfd8-4be5-a397-50b367160e60,0,false,false,2025-09-08 22:56:29.151769+00,2025-09-08 22:56:29.151769+00
61c143ae-e2ea-45ed-9a56-5075ba87a9d8,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is test number 5,,0,241f6fbb-b7e8-4fb4-af16-be9f6a3280d2,0,false,false,2025-09-01 01:29:57.164166+00,2025-09-01 01:29:57.164166+00
652182d9-f022-4d4b-8433-bf374068948e,2474659f-003e-4faa-8c53-9969c33f20b2,photo,ef2676ae-ce52-4780-95b5-833837b07564,This is a test,,0,aade0bcf-3983-41ef-94f9-74d6ba1ac6ef,0,false,false,2025-08-23 10:14:40.841293+00,2025-08-23 10:14:40.841293+00
6ccda629-97f9-4408-8003-c46a1f618221,2474659f-003e-4faa-8c53-9969c33f20b2,author,17977b98-ef9b-4d60-8b4a-35f4ecceb3cb,I love your books,,0,40ee63e2-4793-4359-9f01-1e90388ccd37,0,false,false,2025-08-23 18:05:17.288+00,2025-08-23 18:05:17.288+00
6efb5574-b53f-4838-b8bd-f734cb3971f3,2474659f-003e-4faa-8c53-9969c33f20b2,photo,3ed1019b-3cc4-47bd-804d-d88f8b078a86,This I love,,0,7c4d7d56-7d3a-4899-ad44-5d68b36cd4e6,0,false,false,2025-08-22 00:55:51.861122+00,2025-08-22 00:55:51.861122+00
70257541-99a1-4d0c-9f60-589e95da9605,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,80bb3164-0e7a-4704-b175-481b4224c11e,This is very nice,,0,9432d6e2-77a3-48c8-b10a-502613efa6e1,0,false,false,2025-09-05 02:35:24.881464+00,2025-09-05 02:35:24.881464+00
87f8a0fa-0eb4-49e9-950c-c08ad51a3d81,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,"Brother Bob Marley is an iconic figure

https://res.cloudinary.com/dj8yugwyp/image/upload/v1757117401/authorsinfo/post_photos/kcfx3noqu0co4gvukxqp.webp",,0,e0c520fe-2138-4643-a520-6baa6840dadd,0,false,false,2025-09-06 00:10:56.205982+00,2025-09-06 00:10:56.205982+00
8b1c556e-bf21-4f68-97d4-8cbd61a425f2,c954586e-f506-48b3-ba5d-c6b0d3d561c8,book,80bb3164-0e7a-4704-b175-481b4224c11e,I am testing this comment,,0,4685bf7e-2685-4878-a5b9-8986c202f7ce,0,false,false,2025-09-08 17:49:00.242406+00,2025-09-08 17:49:00.242406+00
8dc63769-2000-480d-b120-fc5ae6029dae,2474659f-003e-4faa-8c53-9969c33f20b2,book,d4f5f22e-3bfe-4dea-aabf-39a82b73c646,Beautiful kid,,0,185536d1-adfe-4112-a1fe-4da9b1b4ea12,0,false,false,2025-09-09 00:19:38.382622+00,2025-09-09 00:19:38.382622+00
9eed2c57-5c65-4194-8e9c-2cc6fbe5f6f4,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is test number 6,,0,49c111d6-c508-4e22-b4ad-f603920d2117,0,false,false,2025-09-01 01:51:29.594162+00,2025-09-01 01:51:29.594162+00
9f6061aa-2345-4032-9019-5b0daab6f08e,2474659f-003e-4faa-8c53-9969c33f20b2,book,80bb3164-0e7a-4704-b175-481b4224c11e,This is the first reply.,4704884a-cc46-472a-a8ea-0da1cd001a0c,0,50e1e176-b490-4c70-a979-4cea43c2b486,1,false,false,2025-09-09 15:59:27.188707+00,2025-09-09 15:59:27.188707+00
a12769d9-7bd7-4da3-8cb1-9c0057c54362,2474659f-003e-4faa-8c53-9969c33f20b2,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is the second test,,0,c8b6c8d1-715f-40d2-b9e0-2dbacc55061c,0,false,false,2025-08-31 18:49:53.838923+00,2025-08-31 18:49:53.838923+00
a684ee68-760d-49ca-99bd-2b64ec044188,2474659f-003e-4faa-8c53-9969c33f20b2,author,17977b98-ef9b-4d60-8b4a-35f4ecceb3cb,Make this work,,0,63938a73-8823-45d5-a388-b94350a8d1e8,0,false,false,2025-08-23 18:29:34.441608+00,2025-08-25 20:27:53.085089+00
af8355eb-b134-46ae-800c-80d00a81461f,2474659f-003e-4faa-8c53-9969c33f20b2,author,e31e061d-a4a8-4cc8-af18-754786ad5ee3,is that so,,0,01abc668-710b-4cc9-a0a0-d8228ba26df0,0,false,false,2025-08-25 14:08:21.911531+00,2025-08-25 14:08:21.911531+00
bbaa2332-208c-439e-ad17-84dd751cbf25,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is the second-level reply test,388c2bca-d430-48fb-98a9-d38431480146,0,584a7202-8459-45ab-b620-5a4603099c80,0,false,false,2025-09-05 04:28:14.596297+00,2025-09-05 04:28:14.596297+00
bd564ff7-e43b-4c88-853c-80612c3394bc,2474659f-003e-4faa-8c53-9969c33f20b2,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,This is the second test,,0,989ba586-d891-4e5a-bcdb-fb61ea9ef53f,0,false,false,2025-08-31 19:32:45.812964+00,2025-08-31 19:32:45.812964+00
ca27139b-eb6b-4a18-85f8-27dc401b2aeb,2474659f-003e-4faa-8c53-9969c33f20b2,author,55aa3fa3-3cd7-452a-a490-92b49171e385,This is the first test,,0,3fd7a22c-cf7e-488e-ad9e-b35941b4a154,0,false,false,2025-08-25 19:35:58.554724+00,2025-08-25 20:27:53.085089+00
d721c110-0ab5-4055-8c30-3d4cbd3b8cc7,2474659f-003e-4faa-8c53-9969c33f20b2,photo,0c9a97b5-9bcf-4efc-843c-2b4488bcb3b4,This is the second comment for this photo,,0,71e52b6f-0be1-4c56-a0bd-64d8fcfaeb61,0,false,false,2025-08-21 16:37:08.961165+00,2025-08-21 16:37:08.961165+00
dd7dea08-dc2a-4af2-a0f9-1bc164af118c,2474659f-003e-4faa-8c53-9969c33f20b2,author,212603ea-6fbf-4815-bbd6-769f55e13ede,Test 5,,0,d68cc8f3-d81b-432d-8d27-15c2384c855f,0,false,false,2025-08-25 04:54:49.001+00,2025-08-25 20:27:53.085089+00
deb930ad-aeae-47b7-8a35-5d9ec892c9f8,2474659f-003e-4faa-8c53-9969c33f20b2,author,17977b98-ef9b-4d60-8b4a-35f4ecceb3cb,I love your work,,0,2f02e77a-2411-4cb2-b041-b74d03aa84f9,0,false,false,2025-08-23 05:25:08.672+00,2025-08-23 05:25:08.672+00
dfc09763-5909-4a97-b885-d91d8ff16c9b,2474659f-003e-4faa-8c53-9969c33f20b2,photo,0c9a97b5-9bcf-4efc-843c-2b4488bcb3b4,I love this,,0,5346fd05-0cbe-4b56-bdd4-bd133e27a581,0,false,false,2025-08-21 16:10:37.840385+00,2025-08-21 16:10:37.840385+00
e10f8f43-6092-4b5d-a90c-90d8d174f266,2474659f-003e-4faa-8c53-9969c33f20b2,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,this is the third test post,,0,a718370c-41d8-4e44-be29-2ff26c34521a,0,false,false,2025-08-31 19:36:16.864533+00,2025-08-31 19:36:16.864533+00
e6547003-4592-4f8f-b625-00ff507c7a49,2474659f-003e-4faa-8c53-9969c33f20b2,photo,718060ac-076b-421e-b052-caa9a837abb4,I love this book,,0,04e71140-38f0-4aa5-9028-6b8fb67202f5,0,false,false,2025-08-21 03:54:05.918515+00,2025-08-21 03:54:05.918515+00
e781e367-e820-42e3-ae43-e4a846e54b92,c954586e-f506-48b3-ba5d-c6b0d3d561c8,book,80bb3164-0e7a-4704-b175-481b4224c11e,I am testing this comment,,0,7b418415-7532-43e3-9792-77e762f4a905,0,false,false,2025-09-08 17:57:39.351936+00,2025-09-08 17:57:39.351936+00
e94bf42a-5915-4e56-aa8f-7020b08740fc,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,a0e17759-d56b-4b84-87fa-f7bb91985aa4,"Im so tied and im fight to live god bless me again to be his Devin angel 😇 since oct 13,1979 sat at 12am. Forever That have bless to have most one kind of heart ❤️  and body and mind. To able share my blessings to everyone who came to life and be came of family for forever.  Thank you so much to all of you 💗  not post their name to respect their private as I agree too. Know who are because we still keep it touch and family forever.  God amazing  Jesus name God bless . From my heart thank you would be enough to say to my family especially my mama & papa who give me life and took care of no matter what happened and support me and respect my self and give me freedom and independence and let me travel to where I need to be and time came home and I would give up everything for them as they have done beyond for me . Everyone thank you and salamat too for all do and done for me. I forever be thankful and bless.♥️not put their names to respect their privacy and i agree to them . Know who you are keep in touch and forver be family.  Amen .... !!!dont own right to song . I love it .. first song I listened when I decide to be came hospice caregiver on july 4, 2007 to ??? When my heart say to stop.  Have a blessed and lovely one too.",,0,6c4b4126-1c55-4878-899c-42d60adf8ca2,0,false,false,2025-09-05 20:40:45.110408+00,2025-09-05 20:40:45.110408+00
e9e7fa24-43e0-4382-9118-6335e6246fa5,2474659f-003e-4faa-8c53-9969c33f20b2,book,80bb3164-0e7a-4704-b175-481b4224c11e,I want to test the second-level reply.,9f6061aa-2345-4032-9019-5b0daab6f08e,0,3afe18fb-c4fd-4906-9492-654f5fb3dbb9,0,false,false,2025-09-09 17:42:04.906741+00,2025-09-09 17:42:04.906741+00
ff49d948-aecb-4bc9-a0cb-db37bc8304f3,2474659f-003e-4faa-8c53-9969c33f20b2,author,d6a00ffa-ba15-4379-8e47-8c68494996b1,This is a test comment,,0,43d107c6-f4d7-48d4-834d-241b80405787,0,false,false,2025-08-25 16:06:02.277923+00,2025-08-25 20:27:53.085089+00
ffebfba9-e279-4093-8ec7-6abd2d206ab5,4ca9b634-8557-427f-9b7f-1d8679b7f332,activity,d6a00ffa-ba15-4379-8e47-8c68494996b1,This is a test 9/4/25 1,,0,14287a5f-0f9b-447e-89f5-8177dbb7d35d,0,false,false,2025-09-04 13:31:38.719459+00,2025-09-04 13:31:38.719459+00