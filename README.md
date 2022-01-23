# JSPM package website

# Develop
- `./chomp --watch`
or
- `./chomp build --watch` &&
- `deno run -A --import-map=deno.importmap --unstable --watch --no-check server.jsx`

# Deploy
- `./chomp clean && ./chomp build`
- Push all the changes including built files