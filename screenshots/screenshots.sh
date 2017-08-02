# If making changes: DO NOT FORGET
# sed -i 's/\r//' screenshots.sh
for x in *.png; do
	if [ -e large/$x ]; then
		echo "large/$x exists"
	else
		echo "making large/$x"
		convert $x -interpolate Nearest -filter point -resize 400% large/$x
	fi
done
