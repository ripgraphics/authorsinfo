            {/* About Section */}
            <Card className="timeline-about-section">
              <div className="timeline-about-section__header flex flex-col space-y-1.5 p-6">
                <div className="timeline-about-section__title-row flex justify-between items-center">
                  <div className="timeline-about-section__title text-2xl font-semibold leading-none tracking-tight">About</div>
                  <button 
                    className="timeline-about-section__view-more text-sm text-primary hover:underline"
                    onClick={() => setActiveTab("about")}
                  >
                    View More
                  </button>
                </div>
              </div>
              <CardContent className="p-6 pt-0">
                <p className="line-clamp-4">{event?.description || "No description available."}</p>
              </CardContent>
            </Card>

            {/* Friends/Followers Section */}
            <Card>
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                <div className="text-2xl font-semibold leading-none tracking-tight">Followers</div>
                <Link href={`/events/${params.id}/followers`} className="text-sm text-primary hover:underline">See All</Link>
              </div>
              <CardContent className="p-6 pt-0">
                <FollowersList
                  followers={event?.followers || []}
                  followersCount={event?.followers?.length || 0}
                  entityId={params.id}
                  entityType="event"
                />
              </CardContent>
            </Card> 