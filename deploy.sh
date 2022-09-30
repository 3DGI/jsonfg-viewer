yarn run build
rsync -rzhP --delete --exclude=".*" dist/ do:/var/www/3dgi-webapps/dev/jsonfg-viewer/