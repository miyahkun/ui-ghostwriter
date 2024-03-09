export type ApiResponse_OauthToken = {
  user_id: number;
  access_token: string;
  expires_in: number;
};

export type ApiResponse_Me = {
  id: string;
  email: string;
  handle: string;
  img_url: string;
};
