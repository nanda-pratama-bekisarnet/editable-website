 - Find the original code in 

        https://github.com/michael/editable-website


 - Modified to run on Cloudflare Pages, D1, and R2.
 - I was relying on chatgpt, friends help, and other sources from the Internet to modify the original codes, 
   as I have just basic knowledge of svelte and/or programming.


#How To (Incomplete)

--- Prepare

 - Clone/Create/Import this repo to your github account
 
 - Install nodejs (Tested on version 20)
 
 - Go to editable-website directory
 
    cd editable-website
 
 - Install the required packages 
    (Watch for dependency error, you should resolved it first before continuing)
 
   npm install
 
 - Login to your cloudflare account using wrangler CLI

   	npx wrangler login
 
 - Create the database on your cloudflare 

	npx wrangler d1 create your-database-name

 - Take note the database_name and database_id
 
 - Bind the D1 database by editing the wrangler.jsonc based on previous step
	- Do Not Change the binding!, keep it as "DB"
	- "database_name": "your-database-name"
	- "database_id": "your-database-id"
 
 - Create Cloudflare R2 from the Web UI
    
	- Create bucket and name it as you like
	- Go to setting and and enable the public development url
	- Take note the URL
	
 - Bind the R2 bucket by editing the wrangler.jsonc based on previous step
    - Do Not Change the binding!, keep it as "R2_BUCKET"
	- "bucket_name": "your-r2-bucket-name"
	- "R2_PUBLIC_URL": "your-r2-public url"
	
 - Create the database schema using Wrangler CLI
   
    npx wrangler d1 execute your-database-name --remote --file=./sql/schema.sql
 
 - Check if the database has been imported succesfully
   
    npx wrangler d1 info <your-database-name>
   
   You should see something like below:
   
      num_tables            │ 5


 --- Deploy to Cloudflare
 
 - Create new pages and link your github repo to your newly created page
 - You should see it bulding corretly and available at certail url provided by cloudflare
 - ..........
 
	



