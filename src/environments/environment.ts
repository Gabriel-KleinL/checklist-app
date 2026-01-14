// AMBIENTE DE DESENVOLVIMENTO LOCAL (padrão para npm start / ionic serve)
// Este arquivo é usado quando você roda o app SEM especificar configuração.
//
// Para produção, use: npm run build --configuration production
// O Angular substitui este arquivo por environment.prod.ts no build de produção.
//
// Backend Node.js deve estar rodando em: http://localhost:8000
// Para iniciar: cd backend && npm start

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  filePrefix: 'b_'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
