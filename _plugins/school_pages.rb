# Plugin to generate school pages from a template and populate from the College Scorecard API

require 'json'
require 'net/http'

module Jekyll

  class SchoolPage < Page

    def initialize(site, base, dest_dir, dest_name, src_dir, src_name)
      @site = site
      @base = base
      @dir  = dest_dir
      @dest_dir = dest_dir
      @dest_name = dest_name
      @dest_url = File.join( '/', dest_dir )
      @dest_url = File.join( '/', dest_dir, dest_name ) if !dest_name.match( /index.html/i )

      src_file = File.join(base, src_dir, "#{src_name}.html" )
      src_name_with_ext = "#{src_name}.html" if File.exists?( src_file )
      src_name_with_ext ||= "#{src_name}.html"

      @name = src_name_with_ext
      self.process(src_name_with_ext)

      # Read the YAML from the specified page
      self.read_yaml(File.join(base, src_dir), src_name_with_ext )
    end
  end

  class Site

    def create_all_school_pages(schools_arr, schools_src_dir, dest_dir)
      schools_arr.each do |school|
        # create school from data
        index = SchoolPage.new(self, self.config['source'], File.join(dest_dir,school['id'],school['slug']), 'index.html', schools_src_dir, 'index')
        # set the school page title
        index.data['title'] = school['name'] + ' | College Scorecard'
        index.data['school_id'] = school['id']
        # index.data['school_data'] = [school['raw_data']]
        index.render(self.layouts, site_payload)
        index.write(self.dest)
        self.pages << index
      end
    end

    # Retrieves parsed JSON of school IDs and names from the given API base URL.
    # Raises an error if it's unable to retrieve or parse the result.
    def school_data_from_api(api_url, api_key, page)
      uri = URI(api_url)
      uri.path = "#{uri.path}" +'schools'
      # Scorecard Schools query
      uri.query = "fields=id,school.name&per_page=100&school.operating=1&2015.student.size__range=1..&2015.academics.program_available.assoc_or_bachelors=true&school.degrees_awarded.predominant__range=1..3&school.degrees_awarded.highest__range=2..4&page=#{page}&api_key=#{api_key}"

      # test schools (limited results)
      # uri.query = "fields=id,school.name&per_page=100&school.name=berkeley&api_key=#{api_key}"
      req = Net::HTTP::Get.new(uri)
      # if user != nil
      #   req.basic_auth user, pass
      # end

      res = Net::HTTP.start(uri.hostname, uri.port,
                            :use_ssl => uri.scheme == 'https') {|http|
        http.request(req)
      }

      ctype = res['Content-Type'].split(';')[0]
      if res.code != '200' or ctype != 'application/json'
        raise 'API returned unexpected result: ' << res.code << ': "' << ctype << '"'
      end

      return JSON.parse(res.body)

    end

    # Retrieves map of school IDs to their full data from the given API base URL.
    # Raises an error if it's unable to retrieve or parse the result.
    def schools_from_api(api_url, api_key)
      schools = {}
      page = 0
      count = 0

      loop do
        data = school_data_from_api(api_url, api_key, page)
        data['results'].each { |r|
          schools[r['id']] = r['school.name']
        }
        count += data['results'].length
        puts("Read #{count}/#{data['metadata']['total']} schools (page #{page})")
        break if count >= data['metadata']['total']
        page = data['metadata']['page'] + 1
      end
      schools_arr = []

      schools.each do |school|
        school_hash = {}
        school_hash['id'] = "#{school[0]}"
        school_hash['name'] = "#{school[1]}"
        # school_hash['name'] = "#{school[1]['school']['name']}"
        # replace non-words with dash (-)
        slug = "#{school_hash['name'].gsub(/\W+/,'-')}"
        school_hash['slug'] =  slug
        # school_hash['raw_data'] = school[1]
        schools_arr.push(school_hash)
      end
      schools_arr
    end
  end

  class SchoolPagesGenerator < Generator
    safe true

    def generate(site)

        if ENV['API_BASE_URL']
          site.config['API']['baseurl'] = ENV['API_BASE_URL']
        end
        if ENV['API_KEY']
          site.config['API']['key'] = ENV['API_KEY']
        end

        schools_arr = site.schools_from_api(site.config['API']['baseurl'], site.config['API']['key'])
        site.create_all_school_pages(schools_arr, 'school', 'school')
      end
  end
end
