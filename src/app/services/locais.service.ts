import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Local {
  id: number;
  nome: string;
  habilitado: boolean;
  ordem: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocaisService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  buscarLocais(apenasHabilitados = true): Observable<Local[]> {
    let url = `${this.baseUrl}/api/locais`;
    if (apenasHabilitados) {
      url += '?apenas_habilitados=true';
    }
    return this.http.get<Local[]>(url);
  }

  buscarNomes(apenasHabilitados = true): Observable<string[]> {
    return this.buscarLocais(apenasHabilitados).pipe(
      map(locais => locais.map(l => l.nome))
    );
  }
}
