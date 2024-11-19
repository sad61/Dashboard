import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private tokenUrl = 'https://accounts.spotify.com/api/token';
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {}

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const authHeader = btoa(`${environment.CLIENT_ID}:${environment.CLIENT_SECRET}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    });

    const body = 'grant_type=client_credentials';

    try {
      const response: any = await lastValueFrom(
        this.http.post(this.tokenUrl, body, { headers })
      );
      this.accessToken = response.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error fetching Spotify access token:', error);
      throw error;
    }
  }

  // Function to play a Spotify track
  async playSpotifyTrack(trackUri: string): Promise<void> {
    const token = await this.getAccessToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const body = {
      uris: [trackUri],
    };

    try {
      await lastValueFrom(
        this.http.put('https://api.spotify.com/v1/me/player/play', body, {
          headers,
        })
      );
      console.log('Playing Spotify track:', trackUri);
    } catch (error) {
      console.error('Error playing Spotify track:', error);
    }
  }
}
