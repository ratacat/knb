.result.chunks[].items[]
| select(.itemKind == "tweet")
| {
    created_at: .payload.legacy.created_at,
    id: .payload.legacy.id_str,
    user: .payload.core.user_results.result.core.screen_name,
    name: .payload.core.user_results.result.core.name,
    followers: .payload.core.user_results.result.legacy.followers_count,
    text: (.payload.note_tweet.note_tweet_results.result.text // .payload.legacy.full_text // ""),
    favs: .payload.legacy.favorite_count,
    rts: .payload.legacy.retweet_count,
    quotes: .payload.legacy.quote_count,
    replies: .payload.legacy.reply_count,
    lang: .payload.legacy.lang,
    url: ("https://x.com/" + .payload.core.user_results.result.core.screen_name + "/status/" + .payload.legacy.id_str)
  }
