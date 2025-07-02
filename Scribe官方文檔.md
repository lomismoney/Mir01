### Getting started
Set up the package
First, follow the installation guide in the introduction.

When you're done, you should have a scribe.php file in your config directory. Cool, now you're ready to take it for a spin. But there are two important settings we need to verify in our scribe.php config file first...

1. Pick a type
The type key tells Scribe the type of docs setup you want. There are two options:

static: This generates a simple index.html file (plus CSS and JS assets) in your public/docs folder. The routing of this file does not pass through Laravel, so you can't add auth or any middleware.
laravel: Scribe will generate a Blade view served via your Laravel app, allowing you to add auth or any middleware to your docs.
Which should you use?
If you need to authenticate access to your docs, use laravel type. Otherwise, if you don't have any special requirements, you can stick with static type.

2. Choose your routes
The second thing you'll need to do is tell Scribe what routes you want to document (the routes key). By default, it looks similar to this:

config/scribe.php

    'routes' => [
        [
            'match' => [
                'domains' => ['*'],
                'prefixes' => ['api/*'],
            ],
            'include' => [
                // 'users.index', 'healthcheck*'
            ],
            'exclude' => [
                // '/health', 'admin.*'
            ],
        ],
    ],

For historical reasons, each entry in the routes array defines a route group. However, we recommend keeping all your routes in a single group.

The important key here is the prefixes. Set it to a path matching your API routes. For instance, the default config (["api/*"]) will match any endpoints that start with <your-app-url>/api/. You can set it to ["*"] to match all endpoints.

Here's the full documentation on configuring routes.

Do a test run
Now, let's do a test run. Run the command to generate your docs.

php artisan scribe:generate

Visit your newly generated docs:

If you're using static type, find the docs/index.html file in your public/ folder and open it in your browser.
If you're using laravel type, start your app (php artisan serve), then visit /docs.
Scribe can also generate a Postman collection and OpenAPI spec. See generating documentation for details.

Great! You've seen what Scribe can do. Now, let's refine our docs to match what we want.

Add general information about your API
Here are some things you can customise with Scribe:

The API URL shown in your docs
The introductory text
Authentication information
Languages for the example requests
A logo to show in your docs.
You can set all these in the config file. For details, see documenting API information.

Add information to your routes
Scribe tries to figure out information about your routes, but you can make it better by adding more information. Here's some information you can enrich:

Groups (you can group your endpoints by domain eg "User management", "Order information")
URL parameters
Request Headers
Body parameters
Query parameters
Example responses
Fields in the response
Check out how to do this in the guide on Documenting your API.

Generate and publish
After making changes as needed, you can run php artisan scribe:generate as many times as you want.

When you're happy with how your documentation looks, you're good to go. You can add the generated documentation to your version control and deploy as normal, and your users will be able to access it as you've configured.

Need more customization?
Don't like how the template looks? Want to change how things are organized, or add a custom language for the examples? Need to translate the docs into a different language? Thinking of custom ways to extract more information about your routes? Check out the guides on localization, plugins, example requests and UI customisation.

### Documenting your API > Start here
Scribe tries to extract as much information about your API as it can from your code, but you can (and should) help it by providing more information.

tip
By default (and in the examples here), Scribe extracts info from your controller/request handler. However, if you prefer an alternative approach, the third-party plugin Scribe-TDD allows Scribe to extract the documentation from your API tests instead.

For example, let's take a simple "healthcheck" endpoint:

routes/api.php
Route::get('/healthcheck', function () {
    return [
        'status' => 'up',
        'services' => [
            'database' => 'up',
            'redis' => 'up',
        ],
    ];
});

From this, Scribe gets:



It's not much, but it's a good start. We've got a URL, example requests, and an example response. Plus, an API tester (Try It Out).

We can make this better by adding some annotations:

routes/api.php

/**
 * Healthcheck
 *
 * Check that the service is up. If everything is okay, you'll get a 200 OK response.
 *
 * Otherwise, the request will fail with a 400 error, and a response listing the failed services.
 *
 * @response 400 scenario="Service is unhealthy" {"status": "down", "services": {"database": "up", "redis": "down"}}
 * @responseField status The status of this API (`up` or `down`).
 * @responseField services Map of each downstream service and their status (`up` or `down`).
 */
Route::get('/healthcheck', function () {
    return [
        'status' => 'up',
        'services' => [
            'database' => 'up',
            'redis' => 'up',
        ],
    ];
});


We've added a title and description of the endpoint (first three lines). We've also added another example response, plus descriptions of some of the fields in the response.

Now, we get richer information:





Sure, our method is a bit noisier now, but that's not all bad! In fact, it has a big advantage—the docs are next to the code, so:

it's harder to forget to update them when you change the code
a new dev can instantly see the docs and understand the endpoint's behaviour.
Of course, Scribe tries to ensure annotations use a human-readable syntax, so they make sense to you, not just to the machine.

Apart from these annotations, Scribe supports some other ways to annotate your API. For example, you can provide general API information and defaults in your config/scribe.php, add or edit YAML files containing the endpoint details (more on that here), or use custom strategies that read your code.

We'll demonstrate these in the next few sections.

tip
You can exclude an endpoint from the documentation by using the @hideFromAPIDocumentation tag in its docblock.

### General API info
You can add basics such as the title, introductory text, base URL and authentication information in your scribe.php config file.

Title
To set the HTML <title> for the generated docs, use the title key. This title will also be used in the Postman collection and OpenAPI spec.

config/scribe.php
  'title' => 'The SideProject API',

If you leave title empty, Scribe will infer it from the value of config('app.name').

Description and introductory text
You can add a description of your API using the description key. This description will be displayed in the docs' "Introduction" section, and in the Postman collection and OpenAPI spec.

The intro_text key is where you'll set the text shown in the "Introduction" section of your docs (after the description).

Markdown and HTML are also supported (see HTML helpers)

config/scribe.php
  'description' => 'Start (and never finish) side projects with this API.',
  'intro_text' => <<<INTRO
This documentation will provide all the information you need to work with our API.

<aside>
As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile).
You can switch the language used with the tabs at the top right (or from the nav menu at the top left on mobile).
</aside>
INTRO




Base URL
note
The base URL is the URL displayed in your docs (so you can also call it the display url). It is separate from the URL used in the API tester (Try It Out), which you can set with the try_it_out.base_url config key.

By default, Scribe will use the current app URL (config('app.url')) as the display URL. However, you can customise this with the base_url key. For example, setting the base_url to this:

config/scribe.php
  'base_url' => 'http://sideprojects.knuckles.wtf',

...means that http://sideprojects.knuckles.wtf will be shown in the generated docs, even if you ran the generate command on localhost or in CI.

Logo
Maybe you've got a pretty logo for your API or company, and you'd like to display that on your documentation page. No worries! To add a logo, set the logo key in scribe.php to the path of the logo. Here are your options:

To point to an image on an external public URL, set logo to that URL.

'logo' => 'http://your-company/logo.png',

To point to an image in your codebase:

if you're using laravel type docs, set logo to the public_path() of the image
if you're using static type, pass in the path to the image relative to the public/docs directory.
For example, if your logo is in public/images:

// static type
'logo' => '../img/logo.png',
// laravel type
'logo' => 'img/logo.png',

If you don't want a logo, set logo to false.

Authentication
You can add authentication information for your API using the auth section in scribe.php.

important
Scribe uses the auth information you specify for four things:

Generating an "Authentication" section in your docs
Adding auth information to the Postman collection and OpenAPI spec
Adding authentication parameters to your example requests for endpoints that use authentication
Adding the necessary auth parameters with the specified value to response calls for endpoints that use authentication
To configure auth, first you need to specify the auth.in and auth.name values for your API. They state the type of the auth parameter and its name, respectively. You also need to set auth.enabled to true. Some examples:

Bearer auth
Basic auth
Custom header
Body parameter
Query parameter
For an API which uses a bearer token in an Authorization header (for instance, Authorization: Bearer i0d7jow867tR09Zx).

config/scribe.php
return [
  'auth' => [
    // ...
    'enabled' => true,
    'in' => 'bearer',
    'name' => 'Authorization', // <-- This value is ignored, as the header name is always "Authorization"
  ],
];

tip
Scribe will automatically turn your auth information into text in the docs. To customise the generated text (or change to a different language), use Laravel's translation system. You can publish Scribe's default translations using php artisan vendor:publish --tag=scribe-translations.

There are some other settings that you have to set in the auth array. Here'sa full example and explanation:

config/scribe.php
return [
  // ...
  'auth' => [
    'enabled' => true,
    'default' => false,
    'in' => 'bearer',
    'name' => 'Authorization',
    'use_value' => env('SCRIBE_AUTH_KEY'),
    'placeholder' => '{ACCESS_TOKEN}',
    'extra_info' => 'You can retrieve your token by visiting your dashboard and clicking <b>Generate API token</b>.',
  ],
];


The default field describes the most common behaviour of your API. If most of your endpoints are authenticated, set this to true, then use @unauthenticated on the method docblock if you need to turn off auth for specific endpoints. If your endpoints are open by default, leave this as false, then use @authenticated on the method doc block to turn on auth for specific endpoints.
The use_value field is only used by Scribe for response calls. During generation, if an endpoint requires auth, Scribe will pass this value. It won't be included in the generated output or examples.
tip
If you need to dynamically generate the auth value for response calls, use the beforeResponseCall() method instead.

The placeholder is the opposite of use_value. It will be used only as a placeholder in the generated example requests.
The extra_info text is appended to the auth description Scribe generates. A good idea would be to tell your users where to get their auth key.
For more information, see the reference documentation on the auth section.

### Endpoint metadata
Endpoint metadata is primarily added via annotations, either via the docblock or PHP attributes. See Supported annotations for a comprehensive list.

Title and description
Docblock
Attributes
To set an endpoint's title and description, just write in the method's docblock. The first paragraph is the title, and the rest is the description. There must be a blank line between title and description. Markdown and HTML are also supported (see HTML helpers).

For instance:

/**
 * Add a word to the list.
 *
 * This endpoint allows you to add a word to the list.
 * It's a really useful endpoint, and you should play around 
 * with it for a bit.
 * <aside class="notice">We mean it; you really should.😕</aside>
 */
public function store(Request $request)
{
    //...
}

note
For best results, the title and description should come before any annotations (@-tag).

This becomes:



Grouping endpoints
For easy navigation, endpoints in your API are organized by groups. You can add an endpoint to a group by using the @group annotation (or the #[Group] attribute), followed by the name of the group.

tip
A better option is often to set @group/#[Group] on the controller instead. This will add all endpoints in that controller to the group, and you can add a group description below the group name.

Docblock
Attributes
/**
 * @group User management
 *
 * APIs for managing users
 */
class UserController extends Controller
{
	/**
	 * Create a user.
	 */
	 public function createUser()
	 {

	 }
	 
	/**
     * Change a user's password.
     * 
	 * @group Account management
	 */
	 public function changePassword()
	 {

	 }
}



Grouping endpoints is optional. Any endpoints not in a group will be placed in a default group specified in your config.

You can also specify subgroups, by using the #[Subgroup] attribute, or the @subgroup (and optionally @subgroupDescription) tag.

Docblock
Attributes
/**
 * @group Resource management
 *
 * APIs for managing resources
 * 
 * @subgroup Servers
 * @subgroupDescription Do stuff with servers
 */
class ServersController extends Controller
{
	/**
	 * This will be in the "Servers" subgroup of "Resource management"
	 */
	 public function createServer()
	 {
	 }
	 
	/**
     * This will be in the "Stats" subgroup of "Resource management"
     * 
	 * @subgroup Stats
	 */
	 public function stats()
	 {

	 }
}

Indicating authentication status
If you have auth.default set to false in your config, your endpoints will be treated as open by default. You can use the @authenticated annotation (or #[Authenticated] attribute) on a method to indicate that the endpoint needs authentication.

Similarly, if you have auth.default set to true in your config, your endpoints will be treated as authenticated by default. You can use the @unauthenticated annotation (or #[Unauthenticated] attribute) on a method to indicate that the endpoint is unauthenticated.

tip
Like with @group, you can place these annotations on the controller so you don't have to write it on each method.

Docblock
Attributes
    /**
     * Create a user
     *
     * This endpoint lets you create a user.
     * @authenticated
     */
     public function create()
     {    
     }

A "Requires authentication" badge will be added to that endpoint in the generated documentation.

### Request headers
You can use the @header docblock tag (or the #[Header] attribute) to specify headers for a single endpoint, in the format @header <name> <optional example>:

Docblock

/**
 * @header X-Api-Version
 * @header Content-Type application/xml
 */

Attributes
use Knuckles\Scribe\Attributes\Header;

#[Header("X-Api-Version")]
#[Header("Content-Type", "application/xml")]

The header will be included in example requests and response calls.

Alternatively, you can specify headers for multiple endpoints in one go by using the apply.headers section of the route group in scribe.php. For instance, with this config:

config/scribe.php
  'routes' => [
    [
      'match' => [
        'domains' => ['*'],
        'prefixes' => ['v2/'],
      ],
      'apply' => [
        'headers' => [ 'Api-Version' => 'v2']
      ]
    ]
  ]

In this example, all endpoints that start with v2/ will have the header Api-Version: v2 included in their example requests and response calls.

### URL parameters
Scribe automatically extracts details about your URL parameters from your routes. It can figure out the names, required/optional status and sometimes the types of your parameters. However, you can overwrite this information or add new details, such as a description, using the @urlParam tag (or the #[UrlParam] attribute).

tip
Scribe can figure out a few details about ID parameters in URLs. For example, if you have a route like /users/{id}, /users/{user}, /{user_id}, Scribe will guess the parameter name (id/user_id), type (type of your User model's primary key), and description ("The ID of the user."). Of course, you can use @urlParam to override these.

The tag takes the name of the parameter, an optional type (defaults to "string"), an optional "required" label, and an optional description. Valid types are string, integer, and number. For instance, if you defined your Laravel route like this:

Route::get("/post/{id}/{lang?}");

you can describe the id and lang parameters like this:

Docblock
Attributes
/**
 * @urlParam id integer required The ID of the post.
 * @urlParam lang The language. Enum: en, fr Example: en
 */
public function getPost()
{
    // ...
}

tip
See the reference section for more examples and details of all you can do with @urlParam and #[UrlParam]

Scribe will generate a random example by default, but you can specify your own value in examples and response calls by ending the description with Example: <your-example>, as we did for the lang parameter above.

This gives:



If you want Scribe to omit a certain optional parameter (lang in our example) in examples and response calls, end the description with No-example. It will still be present in the docs.

/**
 * @urlParam id required The ID of the post.
 * @urlParam lang The language. No-example
 */

### Query and body parameters
Scribe supports multiple ways to describe query and body parameters. You can manually specify them with annotations, or Scribe can extract them from your validation rules.

Using annotations
To describe query or body parameters for your endpoint, use the @queryParam/@bodyParam tags (or #[QueryParam]/#[BodyParam] attributes) on the method handling it.

The @bodyParam tag takes the name of the parameter, a type, an optional "required" label, and an optional description. The @queryParam tag follows the same format, but the type is optional. If you don't specify a type, Scribe will try to figure out the type based on the parameter name (or fallback to string).

tip
See the reference section for more examples and details of all you can do with the query and body param tags.

Valid types:

string
integer/int
number
boolean/bool
object (see Array and object parameters below)
file (see File uploads below)
Additionally, you can append [] to a type any number of times to indicate an array field (integer[] = array of integers).

note
array is not a supported type, and may lead to unexpected errors. You should rather define the type of the array (eg int[], string[]).

Examples:

Docblock
Attributes
/**
* @bodyParam user_id int required The id of the user. Example: 9
* @bodyParam room_id string The id of the room.
* @bodyParam forever boolean Whether to ban the user forever. Example: false
* @bodyParam another_one number This won't be added to the examples. No-example
*/
public function updateDetails()
{
}

/**
 * @queryParam sort string Field to sort by. Defaults to 'id'.
 * @queryParam fields required Comma-separated list of fields to include in the response. Example: title,published_at,is_public
 * @queryParam filters[published_at] Filter by date published.
 * @queryParam filters[is_public] integer Filter by whether a post is public or not. Example: 1
 */
public function listPosts()
{
    // ...
}








tip
If you use form requests, you can place the annotations there instead of in your controller.

/**
 * @queryParam lang required The language.
 * @bodyParam title string The title of the post.
 */
#[BodyParam("body", "string", "The content of the post.")]
class CreatePostRequest extends \Illuminate\Foundation\Http\FormRequest
{

}

// in your controller...
public function createPost(CreatePostRequest $request)
{
    // ...
}

Specifying or omitting examples
By default, Scribe will generate a random value for each parameter, to be used in the example requests and response calls. If you'd like to use a specific example value, you can do so by adding Example: <your-example> to the end of the parameter description.

If you want Scribe to omit a certain optional parameter in examples and response calls:

end the description with No-example if using a tag (@queryParam/@bodyParam)
pass "No-example" as the example: argument if using an attribute (#[QueryParam]/#[BodyParam])
The parameter will still be present in the docs, but not included in examples.

For instance:

/**
 * @queryParam sort Field to sort by. Defaults to 'id'. Example: published_at
 * @queryParam fields required Comma-separated fields to include in the response. Example: title,published_at,id
 * @queryParam filters[published_at] Filter by date published. No-example
*/
#[QueryParam("filters[title]", "Filter by title.", required: false, example: "No-example")]
public function endpoint()


gives:



Array and object parameters
Sometimes you have parameters that are arrays or objects. To handle them in @bodyParam and @queryParam, Scribe uses the following convention:

caution
If you can, you should avoid using query parameters that are arrays or objects. There isn't a standardised format for handling them, so the way your API clients set them may be different from what your server expects (and what Scribe generates).

Arrays
For arrays, use a single field with type <type of items>[]. For instance, to denote an array cars of elements of type integer:

@bodyParam cars integer[]

@bodyParam cars integer[] This is a description. Example: [4, 6]
@bodyParam colors string[] Example: ["red", "blue"]

Objects
For objects, you need:

a parent field with type object
an entry for each field, named with the dot notation <parent name>.<field>
For instance, to denote an object cars with a field name of type string and a field year of type number:

@bodyParam cars object
@bodyParam cars.name string
@bodyParam cars.year number

You can also add descriptions and examples to the parent or children fields if you wish:

@bodyParam cars object Car details. Example: {"name": "Carpenter", "year": 2019}
@bodyParam cars.name string Name of the car.
@bodyParam cars.year int Example: 1997

Arrays of objects
For an array of objects, you need:

a parent field with type object[]
an entry for each field, named with the dot notation <parent name>[].<field>.
For instance, to denote an array of objects cars with each item having field name and year:

@bodyParam cars object[] List of car details. Example: [{"name": "Carpenter", "year": 2019}]
@bodyParam cars[].name string Name of the car.
@bodyParam cars[].year int Example: 1997

If your entire request body is an array, just omit the field name:

@bodyParam [] object[]
@bodyParam [].name string
@bodyParam [].year int

Examples:

Body parameters
Query parameters
/**
* @bodyParam user object required The user details
* @bodyParam user.name string required The user's name
* @bodyParam user.age string required The user's age
* @bodyParam friend_ids int[] List of the user's friends.
* @bodyParam cars object[] List of cars
* @bodyParam cars[].year string The year the car was made. Example: 1997
* @bodyParam cars[].make string The make of the car. Example: Toyota
*/



File uploads
To document file inputs with @bodyParam, use the type file. You can add a description and example as usual.

note
Adding a file parameter will automatically set the 'Content-Type' header in example requests and response calls to multipart/form-data.

For files, your example should be the path to a file that exists on your machine. This path should be either:

absolute, or
relative to your project directory, or
relative to your Laravel storage directory.
If you don't specify an example, Scribe will generate a fake file for example requests and response calls.

/**
 * @bodyParam caption string The image caption
 * @bodyParam image file required The image.
 */



Validation rules
If you use Laravel's validation functionality to validate your incoming request parameters, Scribe can use that information to extract information about your parameters as well as generate examples. Note that not all rules are supported.

Scribe supports validation rules in two forms:

Form requests: Scribe will create an instance of the FormRequest class typehinted in your controller method, and execute its rules() method.
note
Form requests are not initialized by Scribe in the same way as Laravel would, since there is no real HTTP request when generating. If you encounter strange behaviour, you can try customising the initialization process with the instantiateFormRequestUsing() hook.

Inline validators: Scribe will read and parse the validation code in your controller ($request->validate(), Request::validate, Validator::make(), or $this->validate()).
Augmenting the validation rules
Since these rules only describe validation logic, Scribe supports multiple ways for you to provide extra information, like a description and example:

For form requests, add a bodyParameters()/queryParameters() method where you can add a description and example for each parameter. This is especially useful when Scribe's generated value might not pass all validation rules.
For inline validators, add a comment above the parameter, specifying a description and example.
If you specify a description, Scribe will prepend your description to what it generates from your validation rules.

Examples
Inline ($request->validate())
Inline (Request::validate())
Inline (Validator::make())
Form request
public function createPost($request)
{
    $validated = $request->validate([
        // Contents of the post
        'content' => 'string|required|min:100',
        // The title of the post. Example: My First Post
        'title' => 'string|required|max:400',
        'author_display_name' => 'string',
        'author_homepage' => 'url',
        'author_timezone' => 'timezone',
        'author_email' => 'email|required',
        // Date to be used as the publication date.
        'publication_date' => 'date_format:Y-m-d',
        // Category the post belongs to.
        'category' => ['in:news,opinion,quiz', 'required'],
        // This will be included in docs but not in examples. No-example
        'extra' => 'string',
    ]);

    return Post::create($validated);
}

All of these lead to:



note
In inline validators, Scribe currently supports simple string rules and arrays of string rules, as well as custom closure and class rules with certain features (described below). Concatentation, interpolation, and dynamic expressions will be ignored, so it's best to specify rules as an array, so Scribe can ignore the rules it doesn't understand. For example:

$rules = [
  // 👍 Supported
  'param1' => 'rule1|rule2',
  'param2' => ['rule1', 'rule2'],
  // 👍 Supported (the third rule will be ignored if doesn't have a static "docs()" method)
  'param3' => ['rule1', 'rule2', new SomeRule()],
  // ❌ All rules are ignored because of concatenation
  'param4' => 'rule1|rule2:'.$someValues,
  // 😐 Only rule2 is ignored
  'param4' => ['rule1', 'rule2:'.$someValues],
];

Inline validator parsing is also currently not supported in Closure routes.

Supported validation rules
There are three levels of support for validation rules:

Full support: Based on the rule, Scribe can generate a description, type, and valid example for a parameter.
Partial support: Scribe can generate a description and type, but the example generated may not pass validation. You can always specify your own examples.
No support: Any rule not listed below. Scribe will simply ignore them. If you'd like support, you can raise a PR.
Full support
required
in
string
bool/boolean
int/integer
numeric
array
file, image
alpha, alpha_dash, alpha_num
starts_with, ends_with
email, url, ip, json, uuid, regex
digits, digits_between
timezone, date, date_format
before, before_or_equal, after, after_or_equal (Full support when the other date is a value, partial support when it's referencing another field)
accepted and accepted_if
enum
Partial support
required_if, required_unless, required_with, required_without, required_with_all, required_without_all
not_in
same, different
exists
Custom validation rules
If you use laravel's custom class rules you can add a description and a default example for that rule with a docs static method:

use Illuminate\Contracts\Validation\Rule;

class Kilobyte implements Rule
{
    // ...

    public static function docs(): array
    {
        return [
            'description' => 'The data must be a valid Kilobyte representation',
            'example' => '52KB', // Only used if no other supported rules are present
        ];
    }
}

For closure rules you can provide a description of what it validates with a comment above it:

$validator->validate([
    'kilobyte' => [
        /** The value must be a valid kilobyte representation */
        function ($attribute, $value, $fail) {
            // ...
        }
    ]
]);

Using validation rules for query parameters
By default, validation rules are interpreted as body parameters. If you use yours for query parameters instead, you can tell Scribe this by either:

adding the text "Query parameters" anywhere in the form request docblock or in a comment above the inline validator call, or
(form requests only) adding a queryParameters() method (instead of bodyParameters()).
Inline
public function createPost($request)
{
    // Query parameters
    $validated = $request->validate([
        // The page number. Example: 1
        'page' => 'int',
    ]);
}

Form request
/**
 * Query parameters
 * You can still have other stuff in your docblock.
 */
class CreatePostRequest extends FormRequest
{
    public function rules()
    {
        return [
            'page' => 'int',
        ];
    }

    public function queryParameters()
    {
        return [
            'page' => [
                'description' => 'The page number',
                'example' => 1
            ],
        ];
    }
}

### Responses
Overview
Scribe gives you multiple ways to provide example responses for your endpoint:

manually:
you can use the @response tag, followed by an example response
you can place an example in a file and reference it with the @responseFile tag
automatically:
Scribe can generate a response by faking a request to your endpoint (a "response call")
Scribe can generate a response from the @apiResource tags (if you're using Eloquent API resources) or @transformer tags (if you're using Fractal transformers)
You can use all of these strategies within the same endpoint. Scribe will display all the responses it finds.

Additionally, you can add descriptions for fields in your responses.

tip
We'll describe all of these here, but for more details and valid values, you can see the list of supported annotations.

@response/#[Response]
You can provide an example response for an endpoint by using the @response tag with valid JSON (on one line or multiple). Alternatively, you can use the #[Response] attribute with either a JSON string or a PHP array.

👉Full reference and more examples

Docblock
/**
 * @response {
 *  "id": 4,
 *  "name": "Jessica Jones",
 *  "roles": ["admin"]
 * }
 */
public function show($id)
{
    return User::findOrFail($id);
}
Attributes
use Knuckles\Scribe\Attributes\Response;

// As a string
#[Response(<<<JSON
  {
   "id": 4,
   "name": "Jessica Jones",
   "roles": ["admin"]
  }
JSON)]

// As an array
#[Response([
   "id" => 4,
   "name" => "Jessica Jones",
   "roles" => ["admin"],
])]
public function show($id)
{
    return User::findOrFail($id);
}
By default, a status code of 200 is assumed, but you can specify a different one:
Docblock
/**
 * @response 201 {"id": 4, "name": "Jessica Jones"}
 */
Attributes
#[Response('{"id": 4, "name": "Jessica Jones"}', 201)]

This means you can define multiple responses from the same endpoint. With @response, you can use the status and scenario fields to add context to each response. With #[Response], use the status and description arguments.

Docblock
/**
 * @response scenario=success {
 *  "id": 4,
 *  "name": "Jessica Jones"
 * }
 * @response status=404 scenario="user not found" {"message": "User not found"}
 */
 Attributes
#[Response(description: "success", content: [
   "id" => 4,
   "name" => "Jessica Jones"
])]
#[Response(status: 404, description: "user not found", content: '{"message": "User not found"}')]
public function endpoint()

If an endpoint returns a file or some other binary response, you can use <<binary>> as the value of the response, followed by an optional description.

Docblock
/**
 * @response <<binary>> The resized image
 */
 Attributes
 #[Response("<<binary>>", "The resized image")]

 @responseFile/#[ResponseFromFile]
@responseFile works similarly to @response, but instead of inlining the response, you pass a file containing your JSON response. This can be helpful for large responses.

To use this annotation, place the response as a JSON string in a file somewhere in your project directory and specify the relative path to it. For instance, we can put this response in a file named users.get.json in storage/responses/:

{"id":4,"name":"Jessica Jones"}

Then in the controller:
Docblock
Attributes
/**
 * @responseFile storage/responses/users.get.json
 */
public function getUser(int $id)
{
  // ...
}
Attributes
use Knuckles\Scribe\Attributes\ResponseFromFile;

#[ResponseFromFile("storage/responses/users.get.json")]
public function getUser(int $id)
{
  // ...
}
👉Full reference and more examples

tip
You can specify an absolute path, a path relative to your project root, or a path relative to your Laravel storage directory.

Like with @response. you can include a status code, or have multiple @responseFile tags on a single method, distinguished by status code and/or scenario/description.

Docblock
/**
 * @responseFile responses/users.get.json
 * @responseFile status=200 scenario="when authenticated as admin" responses/user.get.admin.json
 * @responseFile 404 responses/user.not_found.json
 */
 Attributes
#[ResponseFromFile("responses/users.get.json")]
#[ResponseFromFile(description: "when authenticated as admin", status: 200, file: "responses/user.get.admin.json")]
#[ResponseFromFile("responses/user.not_found.json", 404)]
public function endpoint()

You can also "merge" responses into one. To do this, add the JSON you want to merge after the file path. For instance, supposing our generic "not found" response located in storage/responses/model.not_found.json says:

{
  "type": "Model",
  "result": "not found"
}

We can change the type to User on the fly like this:

Docblock
/**
 * @responseFile 404 responses/model.not_found.json {"type": "User"}
 */
 Attributes
#[ResponseFromFile("responses/model.not_found.json", 404, merge: ["type" => "User"])]

This will be parsed and merged with the response from the file to give:

{
  "type": "User",
  "result": "not found"
}
Response calls
If Scribe doesn't find any 2xx responses for your endpoint, it will attempt to make a fake HTTP request to the endpoint to get a response (known as a "response call"). We say a fake request, because it doesn't call any actual URLs; it just uses the information it's extracted about your endpoints (headers, body parameters, etc) to build a HTTP request and passes it to your Laravel app as though it came via a URL.

tip
If you don't want a parameter in your docs to be included in a response call, you can specify No-example at the end of its description.

Some key things about response calls:

Response calls aim to be "safe" by default. We don't want to accidentally delete a user or anything like that. By default:

Scribe will try to start a database transaction and roll it back afterwards (see database transactions for some important details about that).
Scribe will only make response calls for GET endpoints.
Response calls are configurable. Most of the configuration is located in the apply.response_calls section for each route group in your Scribe config. You can:

choose which HTTP methods are safe for response calls, or disable it entirely (methods)
specify Laravel config values that should be set for the response call (config)
specify query, body and file parameters to be included in the response call (queryParams, bodyParams, and fileParams)
Authentication and customization
If your endpoints are authenticated, Scribe will use the configured use_value in your auth config. However, if you need more customization, you can use the beforeResponseCall() method to manually set it up. Typically, you'd do this in the boot() method of your AppServiceProvider.

app\Providers\AppServiceProvider.php

use Knuckles\Camel\Extraction\ExtractedEndpointData;
use Symfony\Component\HttpFoundation\Request;
use Knuckles\Scribe\Scribe;

public function boot()
{
    // Be sure to wrap in a `class_exists()`,
    // so production doesn't break if you installed Scribe as dev-only
    if (class_exists(\Knuckles\Scribe\Scribe::class)) {
        Scribe::beforeResponseCall(function (Request $request, ExtractedEndpointData $endpointData) {
            $token = User::first()->api_token;
            $request->headers->add(["Authorization" => "Bearer $token"]);
        });
    }
    // ...
}

The callback you provide will receive the current Symfony\Component\HttpFoundation\Request instance and the details of the current endpoint being extracted. If you have database transactions configured, they will already be activated at that point, allowing you to modify your database freely, and have your changes rolled back after the request.

tip
You can use beforeResponseCall() to modify anything about the outgoing request, not just authentication.

Database transactions
Response calls involve invoking your endpoint, which may lead to changes in your database. To avoid any permanent changes, Scribe tries to run response calls within a database transaction.

However, Scribe only knows of your default database connection. If you're using multiple database connections, you'll need to add them to the database_connections_to_transact array in your config.

Alternatively, you can switch to your test database.

Recommendations
To get the best value from response calls, you should make sure to configure your environment to return production-type responses. For instance, you'll want to turn debug mode off, so that 404/500 responses will return formatted error messages rather than exceptions and stack traces. You might also want to switch the app database to your test database. Additionally, if the endpoints that will be called trigger external services (for example, sending email), you'll want to use dummy service providers.

There are two ways to do this:

Use the apply.response_calls.config key in your Scribe config to override the Laravel config:

config/scribe.php
'response_calls' => [
    'config' => [
        'app.debug' => false,
        'database.default' => 'sqlite',
    ],
],

Add a .env.docs file to your repo with the desired config. This env file will be loaded when you run php artisan scribe:generate --env docs, and will apply to all of Scribe, not just response calls, so you can use this to configure a database where models will be fetched from when using @apiResource or @transformer (see How model instances are generated).

APP_DEBUG=false
DB_DATABASE=sqlite

API resources
If your endpoint uses Eloquent API resources for its response, you can use the @apiResource annotations to tell Scribe how to generate a sample response without actually calling the endpoint. To do this, you'll need two annotations:

@apiResource/#[ResponseFromApiResource]: the name of the resource class.
If you're returning a resource collection via YourResource::collection($things), use @apiResourceCollection or pass collection: true to #[ResponseFromApiResource]. If you're using new YourResourceCollection($things), this is optional.
@apiResourceModel: the Eloquent model to be passed to the resource. You should use @apiResourceModel alongside either @apiResource or @apiResourceCollection.
👉Full reference and more examples

Examples:

App\Http\Resources\UserResource.php
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [ 'id' => $this->id ];
    }
}

Docblock
UserController.php
/**
 * @apiResource App\Http\Resources\UserResource
 * @apiResourceModel App\Models\User
 */
public function showUser(User $user)
{
    return new UserResource($user);
}

/**
 * @apiResourceCollection App\Http\Resources\UserResource
 * @apiResourceModel App\Models\User
 */
public function listUsers()
{
    return UserResource::collection(User::all());
}

/**
 * @apiResourceCollection App\Http\Resources\UserCollection
 * @apiResourceModel App\Models\User
 */
public function listMoreUsers()
{
    return new UserCollection(User::all());
}
Attributes
UserController.php
#[ResponseFromApiResource(UserResource::class, User::class)]
public function showUser(User $user)
{
    return new UserResource($user);
}

#[ResponseFromApiResource(UserResource::class, User::class, collection: true)]
public function listUsers()
{
    return UserResource::collection(User::all());
}

#[ResponseFromApiResource(UserCollection::class, User::class)]
public function listMoreUsers()
{
    return new UserCollection(User::all());
}
Scribe will generate an instance (or instances) of the model and pass the model(s) to the resource class to get the example response. To understand how Scribe generates an instance of your model and how you can customize that, you should check out the section on How model instances are generated.

As with @response, you can also specify a status code:

Docblock
/**
 * @apiResource 201 App\Http\Resources\UserResource
 * @apiResourceModel App\Models\User
 */
 Attributes
#[ResponseFromApiResource(UserResource::class, User::class, 201)]

Pagination
If your endpoint returns a paginated resource response, you can tell Scribe how to paginate by:

using the paginate field on @apiResourceModel or .
using either the paginate, simplePaginate, or cursorPaginate argument on #[ResponseFromApiResource].
Docblock
/**
 * @apiResourceCollection App\Http\Resources\UserCollection
 * @apiResourceModel App\Models\User paginate=10
 */
public function listMoreUsers()
{
    return new UserCollection(User::paginate(10));
}

/**
 * @apiResourceCollection App\Http\Resources\UserCollection
 * @apiResourceModel App\Models\User paginate=15,simple
 */
public function listMoreUsers()
{
    return new UserCollection(User::simplePaginate(15));
}

/**
 * @apiResourceCollection App\Http\Resources\UserCollection
 * @apiResourceModel App\Models\User paginate=15,cursor
 */
public function listMoreUsers()
{
    return new UserCollection(User::cursorPaginate(15));
}
Attributes
#[ResponseFromApiResource(UserCollection::class, User::class, paginate: 10)]
public function listMoreUsers()
{
    return new UserCollection(User::paginate(10));
}

#[ResponseFromApiResource(UserCollection::class, User::class, simplePaginate: 15)]
public function listMoreUsers()
{
    return new UserCollection(User::simplePaginate(15));
}

#[ResponseFromApiResource(UserCollection::class, User::class, cursorPaginate: 15)]
public function listMoreUsers()
{
    return new UserCollection(User::cursorPaginate(15));
}

Additional Data
If your endpoint returns additional fields using the API resource's additional() method, you can indicate this with @apiResourceAdditional or the merge: argument to #[ResponseFromApiResource]:

Docblock
class UserController extends Controller
{
    /**
     * @apiResource App\Http\Resources\UserResource
     * @apiResourceModel App\Models\User
     * @apiResourceAdditional result=success message="User created successfully"
     */
    public function store($request): JsonResponse
    {
        // ... some store code ...
        return UserResource::make($event)->additional([
            'result' => __('success'),
            'message' => __('User created successfully'),
        ]);
    }
}
Attributes
class UserController extends Controller
{

    #[ResponseFromApiResource(UserResource::class, User::class,
        additional: ["result" => "success", "message" => "User created successfully"]
    )]
    public function store($request): JsonResponse
    {
        // ... some store code ...
        return UserResource::make($event)->additional([
            'result' => __('success'),
            'message' => __('User created successfully'),
        ]);
    }
}
Produces output (with default data-wrapper):

{
  "data": {
    "id": 1
  },
  "result": "success",
  "message": "User created successfully"
}

Transformers
If your endpoint uses "transformers" (via the league/fractal package) for its response, you can use the transformer annotations to tell Scribe how to generate a sample response without actually calling the endpoint. To do this, you'll need two annotations:

@transformer: the name of the transformer class. Use @transformerCollection instead if you're returning a collection.
@transformerModel: the model to be passed to the resource. You should use @transformerModel alongside either of the other two.
#[ResponseFromTransformer]: attribute alternative to all three
👉Full reference and more examples

tip
@transformerModel is optional. If you don't specify it, Scribe will attempt to use the class of the first parameter to the transformer's transform(MyModel $model) method (ie MyModel).

For example:

Docblock
/**
 * @transformer App\Transformers\UserTransformer
 */
public function showUser(int $id)
{
    $resource = new Fractal\Resource\Item(User::find($id), new UserTransformer());
    return (new Fractal\Manager)->createData($resource)->toArray();
}

/**
* @transformerCollection App\Transformers\UserTransformer
* @transformerModel App\Models\User
*/
public function listUsers()
{
  $resource = new Fractal\Resource\Collection(User::all(), new UserTransformer());
  return (new Fractal\Manager)->createData($resource)->toArray();
}
Attributes
use Knuckles\Scribe\Attributes\ResponseFromTransformer;

#[ResponseFromTransformer(UserTransformer::class)]
public function showUser(int $id)
{
    $resource = new Fractal\Resource\Item(User::find($id), new UserTransformer());
    return (new Fractal\Manager)->createData($resource)->toArray();
}

#[ResponseFromTransformer(UserTransformer::class, collection: true)]
public function listUsers()
{
  $resource = new Fractal\Resource\Collection(User::all(), new UserTransformer());
  return (new Fractal\Manager)->createData($resource)->toArray();
}

Scribe will generate an instance (or instances) of the model and pass the model(s) to the transformer to get the example response. To understand how Scribe generates an instance of your model and how you can customize that, you should check out the section on How model instances are generated.

If your response data is nested within a Fractal resource key, you can specify it with the resourceKey field on @transformerModel:

Docblock
/**
 * @transformer App\Transformers\UserTransformer
 * @transformerModel App\Models\User resourceKey=user
 */
 Attributes
#[ResponseFromTransformer(UserTransformer::class, User::class, resourceKey: "user")]

You can also specify a status code:

Docblock
/**
 * @transformer 201 App\Transformers\UserTransformer
 * @transformerModel App\Models\User
 */
 Attributes
#[ResponseFromTransformer(UserTransformer::class, User::class, 201)]

Pagination
If your endpoint uses a paginator with the transformer, you can tell Scribe how to paginate via an additional tag, @transformerPaginator, or with the paginate argument of the #[ResponseFromTransformer] attribute.

Docblock
/**
 * @transformerCollection App\Transformers\UserTransformer
 * @transformerModel App\Models\User
 * @transformerPaginator League\Fractal\Pagination\IlluminatePaginatorAdapter 15
 */
public function listMoreUsers()
{
    $users = User::paginate(15)->getCollection();
    $transformer = new Fractal\Resource\Collection($users, new UserTransformer(), 'data');
    $transformer->setPaginator(new IlluminatePaginatorAdapter($users));
    return (new Fractal\Manager)->createData($users)->toArray();
}
Attributes
#[ResponseFromTransformer(UserTransformer::class, paginate: [IlluminatePaginatorAdapter::class, 15])]
public function listMoreUsers()
{
    $users = User::paginate(15)->getCollection();
    $transformer = new Fractal\Resource\Collection($users, new UserTransformer(), 'data');
    $transformer->setPaginator(new IlluminatePaginatorAdapter($users));
    return (new Fractal\Manager)->createData($users)->toArray();
}

How model instances are generated
When generating responses from @apiResourceModel and @transformerModel tags, Scribe needs to generate a sample model to pass to the resource or transformer. Here's the process Scribe follows:

First, it tries the Eloquent model factory: YourModel::factory()->create().

note
create() saves the model to your database. But no worries! Scribe will use a database transaction, using the same database transaction rules as for response calls.

If that fails, it tries YourModel::factory()->make().

If that fails, Scribe calls YourModel::first() to retrieve the first model from the database.

If that fails, Scribe creates an instance using new YourModel().

You can customise this process in a few ways:

Changing the strategies
You can change the order of these strategies, or remove the ones you don't need by editing the examples.models_source config item. By default, it's set to ['factoryCreate', 'factoryMake', 'databaseFirst'], corresponding to the three main strategies above.

Applying states
If you want specific states to be applied to your model factory, you can use the states field on @apiResourceModel or @transformerModel. Separate multiple states with a comma. If you're using attributes, use the factoryStates: argument with an array of states.

Docblock
/**
* @apiResourceCollection App\Http\Resources\UserCollection
* @apiResourceModel App\Models\User states=student,verified
  */
  Attributes
#[ResponseFromApiResource(UserCollection::class, User::class,
    factoryStates: ['student', 'verified']
)]

Loading relations
If you want specific relations to be loaded with your model, you can use the with attribute on @apiResourceModel or @transformerModel. Separate multiple relations with a comma.

Docblock
/**
 * @apiResource App\Http\Resources\UserResource
 * @apiResourceModel App\Models\User with=teacher,classmates
 */
 Attributes
#[ResponseFromApiResource(UserResource::class, User::class,
    with: ['teacher', 'classmate']
)]

Nested relations can be specified using dot notation. HasMany and BelongsToMany relations are supported for factories:

Docblock
/**
 * @apiResource App\Http\Resources\AuthorCollection
 * @apiResourceModel App\Models\Author with=posts.categories
 */
 Attributes
#[ResponseFromApiResource(AuthorCollection::class, Author::class, with: ['posts.categories'])]

note
If your many-to-many relation has extra columns in its pivot table, you'll need to create a helper method named pivot<RelationName> in both factories. For instance, if our post_category table has a priority column:

class PostFactory extends Factory
{
  protected $model = Post::class;

  public function definition(): array
  {
    // ...
  }

  public function pivotCategories(): array
  {
    return [
      'priority' => $this->faker->randomNumber(),
    ];
  }
}

class CategoryFactory extends Factory
{
  protected $model = Category::class;

  public function definition(): array
  {
    // ...
  }

  public function pivotCategories(): array
  {
    return [
      'priority' => $this->faker->randomNumber(),
    ];
  }
}

Response fields
You can add descriptions for fields in your response by adding @responseField/#[ResponseField] to your controller method. If you're using an Eloquent @apiResource to generate your response, you can place the annotation on your resource's toArray() method instead.

👉Full reference and more examples

Docblock
Attributes
#[ResponseField("id", "The id of the newly created word")]
You can leave out the type, and Scribe will figure it out from your responses.

tip
You don't need to specify the full field path if the field is inside an array of objects or wrapped in pagination data. For instance, the above annotation will work fine for all of these responses:

{ "id": 3 }
// Array of objects
[
  { "id": 3 }
]
// Inside "data" key
{
   "data": [
     { "id": 3 }
   ]
}

However, you can also specify the type of the field if you wish:

Docblock
/**
 * @responseField id integer The id of the newly created word
 */
Attributes
#[ResponseField("id", "integer", "The id of the newly created word")]

### Custom endpoints
Three scenarios:

Scenario 1: Scribe keeps getting something wrong. You've tried everything else, and you can't still figure out how to get Scribe to describe some_param correctly.

Scenario 2: You want to sort your endpoints or groups in a specific order, but Scribe keeps going alphabetical.

important
In v4, we replaced this process with a new config item that makes this much easier. You don't need to mess around with the YAML files anymore! Check it out.

Scenario 3: Some packages (like Laravel Passport or Fortify) add extra routes to your application, but you can't document these the usual way, since you can't edit the controller's docblocks.

If you're in any of these scenarios, you can use the final resort: editing the Camel files.

What are the Camel files?
They're those YAML files that show up in your .scribe/endpoints folder after running php artisan scribe:generate. They were added to solve these three exact scenarios, allowing you to override Scribe and pass in external information.

Scenario 1: Editing an existing endpoint or group
To edit an endpoint or group's details, edit the corresponding Camel file. The Camel files are named x.yaml (where x is a number), and are located in .scribe/endpoints after generation. Each file contains one group of endpoints, and looks like this:

<your-app>/.scribe/endpoints/0.yaml
name: Name of the group
description: A description for the group.
endpoints:
- httpMethods: ["POST"]
  uri: api/stuff
  metadata:
    title: Do stuff
    description:
    authenticated: false
  headers:
    Content-Type: application/json
  urlParameters: []
  queryParameters: []
  bodyParameters:
    a_param:
      name: a_param
      description: Something something
      required: true
      example: something
      type: string
  responses:
  - status: 200
    content: '{"hey": "there"}'
    headers: []
    description: '200, Success'
  responseFields: []

As you've probably figured, you can edit the contents of this file, and Scribe will respect your changes when next you run scribe:generate.

To discard your changes at any time, run scribe:generate --force.

Scenario 3: Adding a new endpoint
To add a new endpoint, you need to create a file in the .scribe/endpoints folder that's named custom.x.yaml, where x is any number. In fact, whenever you run scribe:generate, you'll see a custom.0.yaml file show up in your .scribe/endpoints. This file is commented out, so no changes are added, but it contains an example of how you'd add a new endpoint.

caution
The custom.* files have a different format from the other YAML files, so don't copy from one and paste directly into the other.

Here's an example of a custom.*.yaml file. The file contains an array of endpoints, and you can simply edit the example to add yours:

<your-app>/.scribe/endpoints/custom.0.yaml
- httpMethods:
    - POST
  uri: api/doSomething/{param}/{optionalParam?}
  metadata:
    groupName: The group the endpoint belongs to. Can be a new group or an existing group.
    groupDescription: A description for the group. You don't need to set this for every endpoint; once is enough.
    title: 'Do something.'
    description: 'This endpoint allows you to do something.'
    authenticated: false
  headers:
    Content-Type: application/json
    Accept: application/json
  urlParameters:
    param:
      name: param
      description: A URL param for no reason.
      required: true
      example: 2
      type: integer
  queryParameters:
    speed:
      name: speed
      description: How fast the thing should be done. Can be `slow` or `fast`.
      required: false
      example: fast
      type: string
  bodyParameters:
    my_fake_param:
      name: my_fake_param
      description: The things we should do.
      required: true
      example:
        - string 1
        - string 2
      type: 'string[]'
  responses:
    - status: 200
      description: 'When the thing was done smoothly.'
      content: # Your response content can be an object, an array, a string or empty.
         {
           "hey": "ho ho ho"
         }
  responseFields:
    hey:
      name: hey
      description: Who knows?
      type: string # This is optional

### Generating docs
First steps
After you've documented your API, you can generate the docs using the scribe:generate Artisan command.

php artisan scribe:generate

This will:

extract information about your API and endpoints
transform the extracted information into a HTML docs webpage (+ Postman collection and OpenAPI spec, if enabled)
store the extracted API details in some YAML files (in .scribe/endpoints), so you can manually edit them later
If you're using static type, your docs (index.html, CSS and JS files) will be generated to the public/docs folder.

If you're using laravel type:

the Blade view will be at resources/views/scribe/index.blade.php
the CSS and JS assets will be in public/vendor/scribe
the Postman collection and OpenAPI spec will be in storage/app/scribe/.
note
If you're using laravel type, you may need to exclude storage/app/scribe/ from the gitignore (storage/app/.gitignore), as it is ignored by default (meaning your Postman/OpenAPI docs won't be committed). You can add this line to your .gitignore to achieve that:

!scribe/

For more details on what happens when you run generate, see How Scribe Works.

Viewing the docs
To access your generated docs, start your Laravel app (php artisan serve on local), then visit the path you configured (in static.output_path or laravel.docs_url). By default, this would be <your app url>/docs. This works for both types of docs.

tip
If you're using static type, you can also open the public/docs/index.html locally in your browser.

Customising the environment
You can pass the --env option to run this command with a specific env file. For instance, if you have a .env.docs file, running

php artisan scribe:generate --env docs

will make Laravel load the .env.docs file.

This is a handy way to customise the behaviour of your app for documentation purposes—for example, you can disable things like notifications when response calls are running.

The .scribe folder
After you generate your docs, you should also have a .scribe folder. This folder is the "intermediate" output; it holds information about your API that Scribe has extracted, allowing you to overwrite some things before Scribe converts to HTML. See Modifying the docs for details.

You can choose to commit this folder, or not. If you commit this folder, you can make edits to the info Scribe has extracted, and Scribe will respect them when generating your docs on any machine, local or server.

If you don't commit, you can't make any edits to what Scribe has extracted, so generating on a different machine might give different results. Of course, you can still use annotations and other strategies to customise the information that gets passed to Scribe.

note
If you commit the folder, and you generate docs on your server after doing a git pull, you might get warnings from Git about your local changes being overwritten. In that case, you should use git restore . to discard local changes before git pull and scribe:generate.

Generating multiple docs
You can generate multiple independent sets of docs with Scribe by using the --config flag. Supposing you want to have two sets of docs, one for your public API endpoints, and one for the admin endpoints. To do this:

Create a second config file. You can name it something like scribe_admin.php. This file will contain the config for our admin API docs, while scribe.php will retain the config for the public API docs.
Update the config in the new file. Make sure to correctly set:
routes: Configure this so the only routes matched here are your admin endpoints
static.output_path: If you're using static type, set this to a different path from the one in your scribe.php so the docs don't overwrite each other.
laravel.assets_directory: If you're using laravel type, you can set this to a different path from the one in your scribe.php so the docs' assets don't overwrite each other. This only matters if you're using different assets (CSS, JS) for each set of docs.
If you're using laravel type, add a route for your docs (see the note below).
Run php artisan scribe:generate --config scribe_admin (or whatever the name of your config file is).
important
The inbuilt Scribe routing (laravel.add_routes, laravel.docs_url and related settings) will not work for multiple docs. You'll need to add your own routes. You can customise the logic from the routes/ folder in the package repo.

For example:

routes/web.php
Route::view('/docs', 'scribe.index')->name('scribe');
Route::view('/admin/docs', 'scribe_admin.index')->name('scribe-admin');

Running on CI/CD
You might want to generate your docs as part of your deployment process. Here are a few things to note:

If you're using response calls, you should see the recommended setup, to avoid any unintended side effects and get the best possible responses.

You'll also want to set your URLs:

the base URL, which will be displayed in the docs and examples. You can set this with the config item base_url. You'll probably want to set this to your production URL.
the Try It Out URL, which is the URL where the in-browser API tester's requests will go to. You can set this with the config item try_it_out.base_url. You could set this to your production or staging server.      

### Modifying docs
The .scribe folder holds Scribe's intermediate output, allowing you to modify the data Scribe has extracted before it turns them into HTML. You can:

edit the endpoint YAML files (in .scribe/endpoints)
add more endpoints, following the example file at .scribe/endpoints/custom.0.yaml (see Custom endpoints)
edit the introduction and authentication sections (.scribe/intro.md and .scribe/auth.md)
append some content to the end of the docs (by adding a .scribe/append.md file)
When you make changes to this folder, Scribe will try to merge your changes into any information it extracts on future runs.

tip
You can also use the aftergenerating() hook as an option for programmatically modify the docs' output once generation is finished.

If you don't want to wait for Scribe to extract from all your endpoints again. you can use the --no-extraction flag. With this, Scribe will skip extracting data about your API and use the data already present in the .scribe folder.

php artisan scribe:generate --no-extraction

If you change your mind and want to start afresh, you can pass the --force flag to discard your changes.

php artisan scribe:generate --force

### Customising features
Try It Out
By default, your generated docs will include an API tester that lets users test your endpoints in their browser. You can set the URL that requests will be sent to with the try_it_out.base_url config item, or turn it off with try_it_out.enabled.

config/scribe.php
'try_it_out' => [
    'enabled' => true,
    'base_url' => 'http://my.staging.url',
],

important
For Try It Out to work, you'll need to make sure CORS is enabled on your endpoints.

note
If you're using Laravel Sanctum, or another token-based SPA authentication system on your API, you'll need to set try_it_out.use_csrf to true. Scribe will then visit the try_it_out.csrf_url before each request, retrieve the CSRF token from the XSRF-TOKEN cookie, and add it as an X-XSRF-TOKEN header to the request.

Postman collection and OpenAPI specification
By default, Scribe will also generate a Postman collection and OpenAPI spec which you can import into API clients like Postman or Insomnia. Scribe will include the links to them in the menu of your docs.

You can configure these in the postman and openapi sections of your scribe.php file.

config/scribe.php
'postman' => [
    'enabled' => true,
    'overrides' => [
        // 'info.version' => '2.0.0',
    ],
],
'openapi' => [
    'enabled' => true,
    'overrides' => [
        // 'info.version' => '2.0.0',
    ],
],

Each section has two options:

enabled: Set it to false to if you don't want the collection/spec to be generated.

overrides: Fields to merge with the collection/spec after generating. For instance, if you set postman.overrides to ['info.version' => '2.0.0'], then the version key in the info object of your Postman collection will always be set to "2.0.0".

### Sorting and inheritance
Sorting endpoints and groups
By default, endpoint groups are ordered alphabetically in the docs, while endpoints are ordered according to your routes file. You can override this by specifying a sort order in your config file (in groups.order).

List the items you wish to sort in the order you want them. All other items will be sorted as usual after For instance, if you want the "Tokens" group first, followed by "Users" and then all other groups, that would be:

config/scribe.php
'groups' => [
  'order' => [
    'Tokens',
    'Users',
  ]
]

You can also order subgroups and endpoints within the groups. The format for endpoints is HTTP_METHOD /url (eg "POST /tokens".

config/scribe.php
'groups' => [
  'order' => [
    'Tokens' => [
      'POST /tokens'
      'GET /tokens'
    ],
    'Users',
    'Instances' => [
      'Active instances', // <-- a subgroup
      'Instance stats' => [
        'GET /stats' // <- an endpoint in a subgroup
        ],
      'POST /end_all', // <-- an endpoint
    ],
  ]
]

Remember: any groups, subgroups or endpoints you don't specify will be arranged in the normal order after these ones.

Burying Groups
You can bury groups by using the * character to specify where all unspecified groups should be placed.

Note: This only works for the top level groups and is not supported in subgroups.

config/scribe.php
'groups' => [
  'order' => [
    'Tokens',
    'Users',
    // The wildcard character * will match all other groups, including the default group
    '*',
    'Deprecated Endpoints',
  ]
]

Overriding docs for inherited controller methods
Sometimes you have a scenario where some endpoints are very similar—the usual CRUD, just with a different resource (let's say /users and /notes), so you create a parent controller and extend from them.

Base
class CRUDController
{
  public string $resource;

  public function index()
  {
    $class = $this->resource;
    return $class::paginate(20);
  }

  public function create()
  {
    // ...
  }

// ...
}
Children
UserController.php
class UserController extends CRUDController
{
  public string $resource = User::class;
}

NoteController.php
class NoteController extends CRUDController
{
  public string $resource = Note::class;
}
But how do you document these with Scribe? There are no methods in the child classes, so there's nowhere to put your docblocks. And if you put it in the parent class, you'll have the same docs for both users and notes, which won't be correct. To get around this, you can add a static method called inheritedDocsOverrides:

Base
CRUDController.php
class CRUDController
{
  public string $resource;

  #[QueryParam("filter")]
  #[QueryParam("sort")]
  #[Response(["status" => "unauthorized"], 401)]
  public function index()
  {
    $class = $this->resource;
    return $class::paginate(20);
  }

  public function create()
  {
    // ...
  }

// ...
}
Users
Notes
UserController.php
class UserController extends CRUDController
{
  public string $resource = User::class;

  public static function inheritedDocsOverrides()
  {
    return [
      "index" => [
        "metadata" => [
          "title" => "List all users",
          "groupName" => "Users",
        ],
        // Merges with any queryParameters from the parent
        "queryParameters" => [
          "active" => [
            "description" => "Return only active users"
          ],
        ],
        // Using an array *adds* responses to any in the parent
        "responses" => [
          [
            "status" => 200,
            "content" => json_encode(...)
          ],
        ]
        // Using a function replaces all responses
        "responses" => function (ExtractedEndpointData $endpointData) {
          return [
            [
              "status" => 200,
              "content" => json_encode(...)
            ],
          ]:
        },
      ],

      'create' => [
        // ...
      ]
    ];
  }
}
Notes
NoteController.php
class NoteController extends CRUDController
{
  public string $resource = Note::class;

  public static function inheritedDocsOverrides()
  {
    return [
      "index" => [
        "metadata" => [
          "title" => "List all notes",
          "groupName" => "Notes",
        ],
        // Using an array *adds* responses to any in the parent
        "responses" => [
          [
            "status" => 200,
            "content" => json_encode(...)
          ],
        ]
        // Using a function replaces all responses
        "responses" => function (ExtractedEndpointData $endpointData) {
          return [
            [
              "status" => 200,
              "content" => json_encode(...)
            ],
          ]:
        },
      ],

      'create' => [
        // ...
      ]
    ];
  }
}

In the inheritedDocsOverrides() method, you return an array, where each key is a method in the parent controller that you want to override. Within this key, you pass an array containing the data you want to modify. The items here correspond to the stages of route processing. You can also look at the properties of the ExtractedEndpointData data object and its children to know what fields are needed.

For all stages (except responses), the keys you specify will overwrite the inherited ones. This means you can do things like:

Change only the title or group
Overwrite a parameter
Add a parameter,
and so on.

For the responses stage, the responses you specify will be added to the inherited ones.

For each stage, you can use either an array or a function. The function will be called with the current extracted endpoint data, allowing you to dynamically decide what to change. Whatever you return will then replace all the data for that stage. You can use this option if you wish to completely replace responses.

You can also modify the $endpointData object directly instead (at your own risk).

### config/scribe.php
Here are the available options in the config/scribe.php file. They are roughly grouped into two: settings to customize the output, and settings to customize the extraction process.

tip
If you aren't sure what an option does, it's best to leave it set to the default.

Output settings
theme
The theme of the docs. Options:

When using static or laravel: default, elements (modelled after Stoplight Elements). See the theming guide.
When using external_static or external_laravel: scalar, elementsand rapidoc
Default: "default"

type
This is the type of documentation output to generate.

laravel will generate the documentation as a Blade view within the resources/views/scribe folder. The docs will be served through your Laravel app, and you can add routing, authentication, and middleware.
static will generate a static HTMl page in the public/docs folder, which can be visited independent of your Laravel application.
external_static and external_laravel do the same as above, but generate a basic template, passing the OpenAPI spec as a URL, allowing you to easily use the docs with an external generator.
Default: "laravel"

static
Settings for the static type output.

output_path: Output folder. The docs, Postman collection and OpenAPI spec will be placed in this folder. We recommend leaving this as public/docs, so people can access your docs through <your-app>/docs.

Default: "public/docs".

external
Settings for the external_static and external_laravel type output.

html_attributes: Any custom HTML attributes you wish to set. For instance, when using Stoplight Elements, you can pass any of the supported configuration options;
'external' => [
  'html_attributes' => [
    'hideSchemas' => 'true', # Note: values should be strings, not booleans
    'tryItCredentialsPolicy' => 'same-origin',
    'router' => 'history'
  ]
]

laravel
Settings for the laravel type output.

add_routes: Set this to true if you want the documentation endpoint (<your-app>/docs) to be automatically added to your app. To use your own routing, set this to false.

important
If you install this package with --dev, and you run composer install --no-dev in production, add_routes won't work in production.

Default: true

docs_url: The path for the documentation endpoint (if add_routes is true).

Default: "/docs".

assets_directory: Directory within public in which to store CSS and JS assets. By default, assets are stored in public/vendor/scribe. If set, assets will be stored in public/{{assets_directory}}

Default: null.

middleware: List of middleware to be attached to the documentation endpoint (if add_routes is true).

base_url
The base URL to be displayed in the docs. If you leave this empty, Scribe will use the current app URL (config('app.url')).

title
The HTML <title> for the generated documentation, and the name of the generated Postman collection and OpenAPI spec. If this is null, Scribe will infer it from config('app.name').

description
A description for your API. This will be placed in the "Introduction" section, before the intro_text. It will also be used as the info.description field in the generated Postman collection and OpenAPI spec.

intro_text
The text to place in the "Introduction" section (after the description). Markdown and HTML are supported.

note
This setting does nothing if using one of the external_ docs types.

try_it_out
Configure the API tester included in the docs.

enabled: Set this to true if you'd like Scribe to add a "Try It Out" button to your endpoints so users can test them from their browser.

Default: true.

important
For "Try It Out" to work, you'll need to make sure CORS is enabled on your endpoints.

base_url: The base URL where Try It Out requests should go to. For instance, you can set this to your staging server. Leave as null to use the display URL (config(scribe.base_url)).

use_csrf: Fetch a CSRF token before each Try It Out request, and add it as an X-XSRF-TOKEN header to the request. This is needed if you're using Laravel Sanctum,.

Default: false.

csrf_url: The URL to fetch the CSRF token from (if use_csrf is true).

Default: '/sanctum/csrf-cookie'.

logo
Path to an image to use as your logo in the docs. This will be used as the value of the src attribute for the <img> tag, so make sure it points to a public URL or path accessible from your server.

If you're using a relative path, remember to make it relative to your docs output location (static type) or app URL (laravel type). For example, if your logo is in public/img:

for static type (output folder is public/docs), use '../img/logo.png'
for laravel type, use 'img/logo.png'
For best results, the image width should be 230px. Set this to false if you're not using a logo.

Default: false.

last_updated
Scribe shows a "Last updated" label in your docs. You can customize this label by specifying tokens and formats.

note
This setting does nothing if using one of the external_ docs types.

Available tokens are {date:<format>} and {git:<format>}.
The format you pass to date will be passed to PhP's date() function. See the docs for valid options.
The format you pass to git can be either "short" or "long", to get the short or long commit hash.
Examples:

Last updated: {date:F j, Y} 
// => Last updated: March 28, 2022
Last updated on {date:l, jS F} (Git commit {git:short}) 
// => Last updated on 28th March 2022 (Git commit ed8f2dd)

Default: "Last updated: {date:F j, Y}"

groups.default
When documenting your api, you use @group annotations to group API endpoints. Endpoints which do not have a group annotation will be grouped under the groups.default.

Default: "Endpoints".

groups.order
By default, Scribe will sort groups alphabetically, and endpoints in the order their routes are defined. You can override this by listing the groups, subgroups and endpoints here in the order you want them.

Any groups, subgroups or endpoints you don't list here will be added as usual after the ones here. If an endpoint/subgroup is listed under a group it doesn't belong in, it will be ignored.

note
This setting does nothing if using one of the external_ docs types.

To describe an endpoint, follow the format '{method} /{path}' (for example, "POST /users").

Here's an example configuration:

'order' => [
   'This group will come first',
   'This group will come next' => [
       'POST /this-endpoint-will-come-first',
       'GET /this-endpoint-will-come-next',
   ],
   'This group will come third' => [
       'This subgroup comes first' => [
           'GET /this-other-endpoint-will-come-first',
           'GET /this-other-endpoint-will-come-next',
       ]
   ]
],

You can also bury a group. This can be achieved by specifying the group you want to be buried below the * character. Currently this is only supported for top level groups.

Here's an example configuration:


'order' => [
   'This group will come first',
   'This group will come next' => [
       'POST /this-endpoint-will-come-first',
       'GET /this-endpoint-will-come-next',
   ],
   '*', // this specifies the position of all unspecified groups
   'This group will always come last' => [
       'This subgroup comes first' => [
           'GET /this-other-endpoint-will-come-first',
           'GET /this-other-endpoint-will-come-next',
       ]
   ]
],


examples.faker_seed
When generating examples for parameters, Scribe uses the fakerphp/faker package to generate random values. To generate the same example values each time, set this to any number (eg. 1234).

tip
Alternatively, you can set example values for parameters when documenting them.

examples.models_source
With Eloquent API resources and transformers, Scribe tries to generate example models to use in your API responses. By default, Scribe will try the model's factory's create()method, then its make() method, and if that fails, then try fetching the first from the database. You can reorder or remove strategies here.

Default: ['factoryCreate', 'factoryMake', 'databaseFirst']

example_languages
For each endpoint, an example request is shown in each of the languages specified in this array. Currently, only bash (curl), javascript (Fetch), php (Guzzle) and python (requests) are included. You can add extra languages, but you must also create the corresponding Blade view (see Adding more example languages).

Default: ["bash", "javascript"]

note
This setting does nothing if using one of the external_ docs types.

postman
Along with the HTML docs, Scribe can automatically generate a Postman collection for your API. This section is where you can configure or disable that.

For static output, the collection will be created in {static.output_path}/collection.json. For laravel output, the collection will be generated to storage/app/scribe/collection.json. Setting laravel.add_routes to true will add a /collection.json endpoint to fetch it.

enabled: Whether or not to generate a Postman API collection.

Default: true

overrides: Fields to merge with the collection after generating. Dot notation is supported. For instance, if you'd like to override the version in the info object, you can set overrides to ['info.version' => '2.0.0'].

openapi
Scribe can also generate an OpenAPI (Swagger) spec for your API. This section is where you can configure or enable that.

caution
The OpenAPI spec is an opinionated spec that doesn't cover all features of APIs in the wild (such as optional URL parameters). Scribe does its best, but there's no guarantee that the spec generated will exactly match your API structure. Consider using a custom generator if you need more control.

For static output, the spec will be created in {static.output_path}/openapi.yaml. For laravel output, the spec will be generated to storage/app/scribe/openapi.yaml. Setting laravel.add_routes to true will add a /openapi.yaml endpoint to fetch it.

enabled: Whether or not to generate an OpenAPI spec.

Default: false

overrides: Fields to merge with the spec after generating. Dot notation is supported. For instance, if you'd like to override the version in the info object, you can set overrides to ['info.version' => '2.0.0'].

generators: A list of custom generators to be invoked during generation of the OpenAPI spec. Each class must extend the abstract OpenApiGenerator.

Extraction settings
auth
Specify authentication details about your API. This information will be used:

to derive the text in the "Authentication" section in the generated docs
to generate auth info in the Postman collection and OpenAPI spec
to add the auth headers/query parameters/body parameters to the docs and example requests
to set the auth headers/query parameters/body parameters for response calls
Here are the available settings:

enabled: Set this to true if any endpoints in your API use authentication.

Default: false.

default: Specify the default auth behaviour of your API.

If you set this to true, all your endpoints will be considered authenticated by default, and you can opt out individually with the @unauthenticated tag.

If you set this to false, your endpoints will not be authenticated by default, and you can turn on auth individually with the @authenticated tag.

Default: false.

caution
Even if you set auth.default, you must also set auth.enabled to true if you have at least one endpoint that is authenticated!

in: Where is the auth value meant to be sent in a request? Options:

query (for a query parameter)
body (for a body parameter)
basic (for HTTP Basic auth via an Authorization header)
bearer(for HTTP Bearer auth via an Authorization header)
header (for auth via a custom header)
name: The name of the parameter (eg token, key, apiKey) or header (eg Authorization, Api-Key). When in is set to bearer or basic, this value will be ignored, and the header used will be Authorization.

use_value: The value of the parameter to be used by Scribe to authenticate response calls. This will not be included in the generated documentation. If this is empty, Scribe will use a randomly generated value. If you need to customize this value dynamically, you can use the beforeResponseCall() method.

placeholder: The placeholder your users will see for the auth parameter in the example requests. If this is empty, Scribe will generate a realistic-looking auth token instead (for example, "jh86fccvbAx6CmA9VS").

Default: "{YOUR_AUTH_KEY}".

extra_info: Any extra authentication-related info for your users. For instance, you can describe how to find or generate their auth credentials. Markdown and HTML are supported. This will be included in the Authentication section.

strategies
A nested array of strategies Scribe will use to extract information about your routes at each stage. If you write or install a custom strategy, add it here under the appropriate stage. By default, all strategies are enabled.

You can remove the strategies you don't need (for instance, you can remove the UseTransformerTags strategy if you aren't using transformers), add custom ones, or reorder them as you wish.

use Knuckles\Scribe\Config\Defaults;
use function Knuckles\Scribe\Config\{removeStrategies, configureStrategy};

  'strategies' => [
    'metadata' => [
       // I want to use the defaults
      ...Defaults::METADATA_STRATEGIES,
    ],
    'headers' => [
      // I want the defaults, except for some.
      ...removeStrategies(
        Defaults::HEADERS_STRATEGIES,
        [Strategies\Headers\GetFromHeaderTag::class]
      )
    ],
    'urlParameters' => [
      // I want the defaults, plus my own strategy.
      ...Defaults::URL_PARAMETERS_STRATEGIES,
      App\Docs\Strategies\SomeCoolStuff::class,
    ],
    'queryParameters' => [
      // I want the defaults, plus my own strategy, but only on some endpoints
      ...Defaults::QUERY_PARAMETERS_STRATEGIES,
      // `wrapWithSettings` works on any strategy, inbuilt or custom
      App\Docs\Strategies\SomeCoolStuff::wrapWithSettings(
        only: ['POST /cool/*'],
      ),
    ],
    'bodyParameters' => [
      ...Defaults::BODY_PARAMETERS_STRATEGIES,
      // I want the defaults, plus my own strategy, but excluding some endpoints
      App\Docs\Strategies\SomeCoolStuff::wrapWithSettings(
        except: ['POST /uncool'],
      ),
    ],
    // I want the defaults, but I need to adjust the settings on one of them
    'responses' => configureStrategy(
      Defaults::RESPONSES_STRATEGIES,
      Strategies\Responses\ResponseCalls::withSettings(
        only: ['GET *'],
        config: [
          'app.debug' => false,
        ],
        queryParams: [
          // 'key' => 'value',
        ],
        bodyParams: [
          // 'key' => 'value',
        ],
        fileParams: [
          // 'key' => 'storage/app/image.png',
        ],
        cookies: [
          // 'key' => 'storage/app/image.png',
        ],
      )
      ),
    'responseFields' => [
      ...Defaults::RESPONSE_FIELDS_STRATEGIES,
    ],
],

The queryParams, bodyParams, and fileParams keys allow you to set specific data to be sent in response calls. For file parameters, each value should be a valid path (absolute or relative to your project directory) to a file on the machine.

The config key allows you to customise your Laravel app's config for the response call.

routes
The routes section is an array of items describing what routes in your application that should be included in the docs.

For historical reasons, each item in the routes array is a route group. A route group is an array containing rules defining what routes belong in that group (match, include, and exclude). However, we recommend using a single route group.

match
Let's start with the match section. This is where you tell Scribe the endpoints you want to document. The default looks like this:

config/scribe.php
'match' => [
  'prefixes' => ['api/*'],
  'domains' => ['*'],
],

This tells Scribe to match all routes starting with api/. So, for instance:

// 👍 Will match
Route::get('/api/users', [UserController::class, 'listUsers']);
Route::post('/api/users', [UserController::class, 'createUser']);

// ❌ Won't match
Route::get('/status', [StatusController::class, 'getStatus']);

tip
In route groups, * can often be used as a wildcard to mean "anything".

If you're using subdomain routing, you can also limit endpoints by domains. So, a config like this:

'match' => [
  'prefixes' => ['api/*'],
  'domains' => ['v2.acme.co'],
],

// Results:

// 👍 Will match
Route::group(['domain' => 'v2.acme.co'], function () {
  Route::get('/api/users', [UserController::class, 'listUsers']);
  Route::post('/api/users', [UserController::class, 'createUser']);
});

// ❌ Won't match
Route::get('/api/getUsers', [UserControllerV::class, 'listUsers']);

include and exclude
include and exclude allow you to override match. With include, you can add routes to the group, even if they didn't match. With exclude, you can remove routes that matched. Both of these take a list of route names or paths.

For example:

'match' => [
  'domains' => ['v2.acme.co'],
  'prefixes' => ['*'],
],
'include' => ['public.metrics'],
'exclude' => ['internal/*'],


Route::group(['domain' => 'v2.acme.co'], function () {
  // 👍 Will match
  Route::get('/api/users', [UserController::class, 'listUsers']);
  Route::post('/api/users', [UserController::class, 'createUser']);
  // ❌ Matches, but excluded by `exclude`
  Route::get('/internal/users', [InternalController::class, 'listUsers']);
  Route::post('/internal/check', [InternalController::class, 'checkThings']);
});

// 👍 Doesn't match, but included by `include`
Route::get('/metrics', [PublicController::class, 'showMetrics'])
  ->name('public.metrics');

// ❌ Won't match
Route::get('/api/getUsers', [UserControllerV!::class, 'listUsers']);

database_connections_to_transact
To avoid modifying your database, Scribe can run response calls and example model creation (API resource and Transformer strategies) in a database transaction, and then roll it back afterwards. This item is where you specify which database connections Scribe can run transactions for.

By default, this is set to your default database connection (config('database.default')), so if you only use one database connection, you should be fine. If you use multiple connections, you should add them to the array. For example:

config/scribe.php
'database_connections_to_transact' => [
    config('database.default'),
    'pgsql',
],

fractal
This section only applies if you're using transformers for your API (via the league/fractal package), and documenting responses with @transformer and @transformerCollection. Here, you configure how responses are transformed.

serializer: If you are using a custom serializer with league/fractal, you can specify it here. Leave this as null to use no serializer or return a simple JSON.

Default: null

routeMatcher
The route matcher class is responsible for fetching the routes to be documented. The default matcher is the included \Knuckles\Scribe\Matching\RouteMatcher, but you can provide your own custom implementation if you wish. The provided matcher should implement \Knuckles\Scribe\Matching\RouteMatcherInterface.

### Supported annotations
Supported annotations
PHP 8 attributes vs docblock tags
Scribe v4 introduced PHP 8 attributes that provide the same functionality as the old docblock tags. Here's a quick comparison of what they look like:
Docblock
/**
 * Healthcheck
 *
 * Check that the service is up. If everything is okay, you'll get a 200 OK response.
 *
 * Otherwise, the request will fail with a 400 error, and a response listing the failed services.
 *
 * @response 400 scenario="Service is unhealthy" {"status": "down", "services": {"database": "up", "redis": "down"}}
 * @responseField status The status of this API (`up` or `down`).
 * @responseField services Map of each downstream service and their status (`up` or `down`).
 */
public function healthcheck() {
    return [
        'status' => 'up',
        'services' => [
            'database' => 'up',
            'redis' => 'up',
        ],
    ];
});
Attributes

#[Endpoint("Healthcheck", "
   Check that the service is up. If everything is okay, you'll get a 200 OK response.

   Otherwise, the request will fail with a 400 error, and a response listing the failed services.
")]
#[Response(["status" => "down", "services" => ["database" => "up", "redis" => "down"]], status: 400, description: "Service is unhealthy")]
#[ResponseField("status", "The status of this API (`up` or `down`).")]
#[ResponseField("services", "Map of each downstream service and their status (`up` or `down`).")]
public function healthcheck() {
    return [
        'status' => 'up',
        'services' => [
            'database' => 'up',
            'redis' => 'up',
        ],
    ];
});
Attributes have the following advantages over tags:

They're less error-prone (for us). With docblocks, everything is a string, so we have to parse it, and try to guess your intentions. There's a lot that can go wrong there. With attributes, you give us the exact values you want.
They're less error-prone (for you). Attributes are a language feature, so you have IDE help built in. For instance, typing in #[Response( will bring up the list of parameters, so you don't need to memorize the specific order or field names.
They're programmable. Since attributes are actual PHP code (with some limits), you can do more. For instance, you can have #[ResponseFromApiResource(paginate: self::PAGINATION_CONFIG)]. You can create your own attributes to avoid repeating the same things.
On the flip side, attributes:

can be bulky. They especially don't look good for long text, such as descriptions.
don't look good on inline (closure) routes.
// This isn't valid PHP
#[Authenticated]
Route::get('/endpoint', function () { ... });

// This works, but it's not very nice visually.
Route::get(
  '/endpoint',

  #[Authenticated]
  function () { ...
  });

The good news is that you can mix them!

That means you can write an endpoint like this:

/**
 * Healthcheck
 *
 * Check that the service is up. If everything is okay, you'll get a 200 OK response.
 *
 * Otherwise, the request will fail with a 400 error, and a response listing the failed services.
 */
#[Response(["status" => "down", "services" => ["database" => "up", "redis" => "down"]], status: 400, description: "Service is unhealthy")]
#[ResponseField("status", "The status of this API (`up` or `down`).")]
#[ResponseField("services", "Map of each downstream service and their status (`up` or `down`).")]
public function healthcheck() {
    return [
        'status' => 'up',
        'services' => [
            'database' => 'up',
            'redis' => 'up',
        ],
    ];
});


This way, the text part stays textual, while the structured part uses the defined attributes.

If you'd like to try attributes, we made a Rector rule to automatically convert your tags to attributes. It will convert parameter tags to attributes, but leave text like endpoint titles and descriptions untouched.

Format
Annotations in docblocks typically consist of a tag (@-something) followed by text in a certain format. Some important details: Attributes are written like a regular PHP function call, and you can use named parameters to make the code clearer.

Some things to note about tags:

The @hideFromAPIDocumentation, @authenticated and @unauthenticated tags are the only boolean tags; they don't take any text after them.

In the "Format" sections below, ? indicates an optional value.

Tags typically default required to false

Most annotations are written in a "natural" format, @tag value1 value2, where Scribe figures out what value1 and value2 represent, based on the order. However, some tags also support fields (@tag key1=value1 value2 or @tag value2 key1=value1).

Tag fields don't have to follow a specific order; they can be at the start or end of the tag (but they generally cannot be in the middle). Tag attribute values which consist of multiple words should use quotes (eg @tag key1="this is value1" value2).

Some things to note about attributes:

They all live under the Knuckles\Scribe\Attributes namespace. So you can either write #[Knuckles\Scribe\Attributes\Header], or write #[Header] and have an import statement (use Knuckles\Scribe\Attributes\Header).
Since they're regular PHP, you can easily find out the arguments with your IDE, like you would for a normal function call. We won't list all the arguments here.
Attributes typically default required to true
Here's a list of all the docblock annotations Scribe supports.

Metadata
tip
All metadata annotations can be used on the method or class docblock. Using them on the class will make them apply to all endpoints in that class.

Tag	Description	Format
@hideFromAPIDocumentation	Excludes an endpoint from the docs	@hideFromAPIDocumentation
@group	Adds an endpoint to a group	@group <groupName>
Example: @group User management
@authenticated	Indicates that an endpoint needs auth	@authenticated
@unauthenticated	Opposite of @authenticated	@unauthenticated
Request parameters
@header / #[Header]
Describes a request header.

Format: @header <name> <example?>

Examples:

Docblock
@header Api-Version
@header Content-Type application/xml
Attributes
#[Header("X-Api-Version")]
#[Header("Content-Type", "application/xml")]
public function endpoint() {...}

@urlParam/#[UrlParam]
Describes a URL parameter.

Tag format: @urlParam <name> <type?> required? <description?> Enum: <list of values?> Example: <example?>

Notes:

If you don't supply a type, string is assumed.
To specify allowed values for this parameter:
for tags: write "Enum: ", followed by the list of values.
for attributes: use the enum parameter with either a PHP 8.1 enum or an array of values.
To prevent Scribe from including this parameter in example requests:
end the description with No-example when using tags
pass"No-example"as the example parameter when using attributes
You can also use this on Form Request classes.
Examples:

Docblock
@urlParam id
@urlParam id int
@urlParam id int required
@urlParam id int required The user's ID.
@urlParam language The language. Enum: en, de, fr
@urlParam language The language. Enum: en, de, fr. Example: en
@urlParam id int required The user's ID. Example: 88683
@urlParam id int The user's ID. Example: 88683
@urlParam id int The user's ID. No-example

Attributes
#[UrlParam("id")]
#[UrlParam("id", "int")]
#[UrlParam("id", "int")]
#[UrlParam("id", "int", "The user's ID.")]
#[UrlParam("id", "int", "The user's ID.", example: 88683)]
#[UrlParam("language", "The language.", enum: ["en", "de", "fr"])]
#[UrlParam("language", "The language.", enum: SupportedLanguage::class)]
#[UrlParam("language", "The language.", enum: SupportedLanguage::class, example: "en")]
#[UrlParam("id", "int", "The user's ID.", required: false, example: 88683)]
#[UrlParam("id", "int", "The user's ID.", required: false, example: "No-example")]
public function endpoint() {...}

@queryParam/#[QueryParam]
Describes a query parameter.

Format: @queryParam <name> <type?> required? <description?> Example: <example?>

Notes:

If you don't supply a type, string is assumed.
To specify allowed values for this parameter:
for tags: write "Enum: ", followed by the list of values.
for attributes: use the enum parameter with either a PHP 8.1 enum or an array of values.
To prevent Scribe from including this parameter in example requests:
end the description with No-example when using tags
pass"No-example"as the example parameter when using attributes
You can also use this on Form Request classes.
Examples:

Docblock
@queryParam date The date. Example: 2022-01-01
@queryParam language The language. Enum: en, de, fr
@queryParam language The language. Enum: en, de, fr. Example: en
@queryParam page int
@queryParam page int The page number.
@queryParam page int required The page number. Example: 4
@queryParam page int The page number. No-example
Attributes
#[QueryParam("date", description: "The date.", example: "2022-01-01")]
#[QueryParam("language", "The language.", enum: ["en", "de", "fr"])]
#[QueryParam("language", "The language.", enum: SupportedLanguage::class)]
#[QueryParam("language", "The language.", enum: SupportedLanguage::class, example: "en")]
#[QueryParam("page", "int", required: false)]
#[QueryParam("page", "int", "The page number.", required: false)]
#[QueryParam("page", "int", "The page number.", example: 4)]
#[QueryParam("page", "int", "The page number.", required: false, example: "No-example")]
public function endpoint() {...}

@bodyParam/#[BodyParam]
Describes a request body parameter.

Format: @bodyParam <name> <type> required? <description?> Example: <example?>

Notes:

To specify allowed values for this parameter:
for tags: write "Enum: ", followed by the list of values.
for attributes: use the enum parameter with either a PHP 8.1 enum or an array of values.
To prevent Scribe from including this parameter in example requests:
end the description with No-example when using tags
pass"No-example"as the example parameter when using attributes
You can also use this on Form Request classes.
Examples:

Docblock
@bodyParam language string The language. Enum: en, de, fr
@bodyParam language string The language. Enum: en, de, fr. Example: en
@bodyParam room_id string
@bodyParam room_id string required The room ID.
@bodyParam room_id string The room ID. Example: r98639bgh3
@bodyParam room_id string Example: r98639bgh3

// Objects and arrays
@bodyParam user object required The user data
@bodyParam user.name string required The user's name.
@bodyParam user.age int Example: 1000
@bodyParam people object[] required List of people
@bodyParam people[].name string Example: Deadpool

// If your entire request body is an array
@bodyParam [] object[] required List of things to do
@bodyParam [].name string Name of the thing. Example: Cook
Attributes
#[BodyParam("language", "The language.", enum: ["en", "de", "fr"])]
#[BodyParam("language", "The language.", enum: SupportedLanguage::class)]
#[BodyParam("language", "The language.", enum: SupportedLanguage::class, example: "en")]
#[BodyParam("room_id", "string")]
#[BodyParam("room_id", "string", "The room ID.")]
#[BodyParam("room_id", "string", "The room ID.", required: false, example: "r98639bgh3")]
#[BodyParam("room_id", "string", required: false, example: "r98639bgh3")]
public function endpoint() {...}

// Objects and arrays
#[BodyParam("user", "object", "The user data")]
#[BodyParam("user.name", "string", "The user's name.")]
#[BodyParam("user.age", "int", required: false, example: 1000)]
#[BodyParam("people", "object[]", "List of people")]
#[BodyParam("people[].name", "string", required: false, example: "Deadpool")]
public function endpoint() {...}

// If your entire request body is an array
#[BodyParam("[]", "object[]", "List of things to do")]
#[BodyParam("[].name", "string", "Name of the thing.", required: false, example: "Cook")]
public function endpoint() {...}

Responses
@response/#[Response]
Describes an example response.

Format: @response <status?> <response>

Notes:

If you don't specify a status, Scribe will assume 200.
Supported fields: scenario, status
Examples:

Docblock
@response {"a": "b"}
@response 201 {"a": "b"}
@response 201 {"a": "b"} scenario="Operation successful"
@response status=201 scenario="Operation successful" {"a": "b"}
@response scenario=Success {"a": "b"}
@response 201 scenario="Operation successful" {"a": "b"}

Attributes
#[Response('{"a": "b"}')]
#[Response(["a" => "b"])]
#[Response(["a" => "b"], 201)]
#[Response('{"a": "b"}', 201, "Operation successful")]
#[Response(["a" => "b"], description: "Success")]
public function endpoint() {...}

@responseFile/#[ResponseFile]
Describes the path to a file containing an example response. The path can be absolute, relative to your project directory, or relative to your Laravel storage directory.

Format: @responseFile <status?> <filePath>

Notes:

If you don't specify a status, Scribe will assume 200.
Supported fields: scenario, status
Examples:

Docblock
@responseFile /an/absolute/path
@responseFile 400 relative/path/from/your/project/root
@responseFile status=400 scenario="Failed" path/from/your/laravel/storage/directory
@responseFile 400 scenario="Failed" path/from/your/laravel/storage/directory


Attributes
#[ResponseFile("/an/absolute/path")]
#[ResponseFile("relative/path/from/your/project/root", 400)]
#[ResponseFile("path/from/your/laravel/storage/directory", 400, description: "Failed")]
public function endpoint() {...}

@responseField/#[ResponseField]
Describes a field in the response.

Format: @responseField <name> <type?> <description?>

Notes:

You can omit the type; Scribe will try to figure it out from your example responses.
To specify allowed values for this parameter:
for tags: write "Enum: ", followed by the list of values.
for attributes: use the enum parameter with either a PHP 8.1 enum or an array of values.
You can also use this on Eloquent API resource toArray() methods.
From v4.38, you can also specify required (@responseField total required The total number of results/#[ResponseField("total", "int", required: true, "The total number of results.")]).
From v4.38, you can also specify nullable (currently only supported in the attribute). This will only show up in the OpenAPI spec.
Examples:

Docblock
@responseField total The total number of results.
@responseField total int The total number of results.
@responseField language The language. Enum: en, de, fr
@responseField language The language. Enum: en, de, fr. Example: en

Attributes
#[ResponseField("total", "The total number of results.")]
#[ResponseField("total", "int", "The total number of results.")]
#[ResponseField("language", "The language.", enum: ["en", "de", "fr"])]
#[ResponseField("language", "The language.", enum: SupportedLanguage::class)]
#[ResponseField("language", "The language.", enum: SupportedLanguage::class, example: "en")]
public function endpoint() {...}

@apiResource
Tells Scribe how to generate a response using an Eloquent API resource. Must be used together with @apiResourceModel.

From 4.20.0, @apiResource may be used without an @apiResourceModel tag (in this case, an empty array will be passed to the resource if no model could be inferred).

Format: @apiResource <status?> <resourceClass>

Notes:

If you don't specify a status, Scribe will assume 200.
Examples:

@apiResource App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User

@apiResource 201 App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User

@apiResourceCollection
Tells Scribe how to generate a response using an Eloquent API resource collection. Must be used together with @apiResourceModel.

Format: @apiResourceCollection <status?> <resourceClass>

Notes:

If you don't specify a status, Scribe will assume 200.
Examples:

@apiResourceCollection App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User

@apiResourceCollection App\Http\Resources\UserApiResourceCollection
@apiResourceModel App\Models\User

@apiResourceCollection 201 App\Http\Resources\UserApiResourceCollection
@apiResourceModel App\Models\User

@apiResourceModel
Tells Scribe the model to use when generating the Eloquent API resource response. Can only be used together with @apiResource or @apiResourceCollection.

note
You can omit this tag, if your API resource uses an @mixin tag referencing the model.

Format: @apiResourceModel <modelClass>

Notes:

Supported fields:
states: Comma-separated list of states to be applied when creating an example model via factory.
with: Comma-separated list of relations to be loaded with the model. Works for factory (Laravel 8+) or database fetching.
paginate: The number of items per page (when generating a collection). To use simple pagination instead, add ,simple after the number.
You can also specify these fields directly on the @apiResource tag instead
@apiResource App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User

@apiResourceCollection App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User states=editor,verified

@apiResource App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User with=accounts,pets

@apiResourceCollection App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User paginate=5

@apiResourceCollection App\Http\Resources\UserApiResourceCollection
@apiResourceModel App\Models\User paginate=5,simple

@apiResource App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User with=accounts states=editor,verified

@apiResourceAdditional
Specifies additional metadata for an API resource. Can only be used with @apiResource and @apiResourceCollection. The additional metadata is specified as fields (key-value pairs).

Format: @apiResourceAdditional <key1>=<value1> ... <keyN>=<valueN>

Notes:

Supported formats for key-value pairs:
key=value
key="long text with spaces"
"key with spaces"="long text with spaces"
Examples:

@apiResource App\Http\Resources\UserApiResource
@apiResourceModel App\Models\User
@apiResourceAdditional result=success message="User created successfully"

#[ResponseFromApiResource]
All-in-one attribute alternative to @apiResource, @apiResourceCollection, @apiResourceModel and @apiResourceAdditional.

Examples:

use App\Models\User;
use App\Http\Resources\UserApiResource;
use App\Http\Resources\UserApiResourceCollection;

#[ResponseFromApiResource(UserApiResource::class, User::class)]
#[ResponseFromApiResource(UserApiResource::class)] // You can omit the model name if your resource has an @mixin tag
#[ResponseFromApiResource(UserApiResource::class, User::class, status: 201)]
#[ResponseFromApiResource(UserApiResource::class, User::class, 201, description: "User details")]
public function endpoint() {...}

// Collections
#[ResponseFromApiResource(UserApiResource::class, User::class, 201, collection: true)]
#[ResponseFromApiResource(UserApiResourceCollection::class, User::class, 201)]
public function endpoint() {...}

// Specifying factory states and relations
#[ResponseFromApiResource(UserApiResource::class, User::class,
    factoryStates: ['editor', 'verified'], with: ['accounts', 'pets'])]
public function endpoint() {...}

// Pagination
#[ResponseFromApiResource(UserApiResourceCollection::class, User::class, paginate: 10)]
#[ResponseFromApiResource(UserApiResource::class, User::class, collection: true, paginate: 10)]
#[ResponseFromApiResource(UserApiResource::class, User::class, collection: true, simplePaginate: 10)]
public function endpoint() {...}

// Additional data
#[ResponseFromApiResource(UserApiResource::class, User::class, 201,
    merge: ["result" => "success", "message" => "User created successfully")]
public function endpoint() {...}


Responses via Fractal Transformers
@transformer
Tells Scribe how to generate a response using a Fractal transformer. Can be used together with @transformerModel.

Format: @transformer <status?> <transformerClass>

Notes:

If you don't specify a status, Scribe will assume 200.
If you don't specify transformerModel, Scribe will use the first argument to your method.
Examples:

@transformer App\Http\Transformers\UserTransformer
@transformerModel App\Models\User

@transformer 201 App\Http\Transformers\UserTransformer
@transformerModel App\Models\User

@transformerCollection
Tells Scribe how to generate a response using a Fractal transformer collection. Can be used together with @transformerModel and @transformerPaginator.

Format: @transformerCollection <status?> <transformerClass>

Examples:

@transformerCollection App\Http\Transformers\UserCollectionTransformer
@transformerModel App\Models\User

@transformerCollection 201 App\Http\Transformers\UserCollectionTransformer
@transformerModel App\Models\User

@transformerModel
Tells Scribe the model to use when generating the Fractal transformer response. Can only be used together with @transformer or @transformerCollection (along with @transformerPaginator).

Format: @transformerModel <modelClass>

Notes:

Supported fields:
states: Comma-separated list of states to be applied when creating an example model via factory.
with: Comma-separated list of relations to be loaded with the model. Works for factory (Laravel 8+) or database fetching.
resourceKey: The resource key to be used during serialization.
@transformer App\Http\Transformers\UserTransformer
@transformerModel App\Models\User

@transformerCollection App\Http\Transformers\UserTransformer
@transformerModel App\Models\User states=editor,verified

@transformer App\Http\Transformers\UserTransformer
@transformerModel App\Models\User with=accounts,pets

@transformerPaginator
Tells Scribe the paginator to use when generating the Fractal transformer response. Can only be used together with @transformerCollection.

Format: @transformerPaginator <adapterClass> <perPage?>

Examples:

@transformerCollection App\Http\Transformers\UserCollectionTransformer
@transformerModel App\Models\User
@transformerPaginator League\Fractal\Pagination\IlluminatePaginatorAdapter

@transformerCollection App\Http\Transformers\UserCollectionTransformer
@transformerModel App\Models\User
@transformerPaginator League\Fractal\Pagination\IlluminatePaginatorAdapter 15

#[ResponseFromTransformer]
All-in-one attribute alternative to @transformer, @transformerCollection, @transformerModel and @transformerPaginator.

Examples:

use App\Models\User;
use App\Http\Transformers\UserTransformer;
use App\Http\Transformers\UserCollectionTransformer;
use League\Fractal\Pagination\IlluminatePaginatorAdapter;

#[ResponseFromTransformer(UserTransformer::class, User::class)]
#[ResponseFromTransformer(UserTransformer::class, User::class, status: 201)]
#[ResponseFromTransformer(UserTransformer::class, User::class, 201, description: "User details")]
#[ResponseFromTransformer(UserTransformer::class, User::class, 201, resourceKey: "uuid")]
public function endpoint() {...}

// Collections
#[ResponseFromTransformer(UserTransformer::class, User::class, 201, collection: true)]
#[ResponseFromTransformer(UserCollectionTransformer::class, User::class, 201)]
public function endpoint() {...}

// Specifying factory states and relations
#[ResponseFromTransformer(UserTransformer::class, User::class,
    factoryStates: ['editor', 'verified'], with: ['accounts', 'pets'])]
public function endpoint() {...}

// Pagination
#[ResponseFromTransformer(UserCollectionTransformer::class, User::class,
    paginate: [IlluminatePaginatorAdapter::class])]
#[ResponseFromTransformer(UserTransformer::class, User::class, collection: true,
    paginate: [IlluminatePaginatorAdapter::class, 15])]
public function endpoint() {...}

### HTML helpers
Scribe supports Markdown (and, by extension, HTML) in a couple of places:

the description and intro_text in your config file
the endpoint title and description in docblocks
the group name and description in docblocks (@group)
parameter descriptions in docblocks
Scribe provides some custom HTML and CSS styling that you can use to highlight information in your docs:

important
These styling changes only affect UIs managed by Scribe (ie not the external_* types).

note
The specific styling of these items will depend on your chosen theme. Examples are shown here using the default theme.

Badges
You can add badges by using the badge CSS class, along with one of the badge-{colour} classes.

<small class="badge badge-green">GET</small>
<small class="badge badge-darkred">REQUIRES AUTHENTICATION</small>

 

Available colours:

darkred
red
blue
darkblue
green
darkgreen
purple
black
grey
Notes and warnings
You can add little highlighted warnings and notes using the <aside> tag and either of the classes notice, warning, or success.

<aside class="warning">Don't do this.</aside>
<aside class="success">Do this.</aside>
<aside class="notice">You should know this.</aside>



If you don't specify a class, "notice" is assumed.

Fancy headings
You can help your lower-level headings stand out by using the fancy-heading-panel class:

<h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>

### Plugin API
Plugins (custom strategies) allow you to provide Scribe with more information about your endpoints. This document describes the plugin API. For a guide to creating plugins, see Writing Plugins.

Each plugin must extend the base strategy class, Knuckles\Scribe\Extracting\Strategies\Strategy, which is an abstract class defined like this:

use Knuckles\Camel\Extraction\ExtractedEndpointData;
use Knuckles\Scribe\Tools\DocumentationConfig;

abstract class Strategy
{
    /**
     * The Scribe config
     */
    protected DocumentationConfig $config;
    
    /**
     * @param ExtractedEndpointData $endpointData
     * @param array $settings Settings to be applied to this strategy.
     *
     * @return array|null
     */
    abstract public function __invoke(
        ExtractedEndpointData $endpointData,
        array $settings = []
    ): ?array;
}

tip
You can run php artisan scribe:strategy <className> to generate a strategy.

$config
The $config property is an instance of the Scribe configuration (= config('scribe')). You can retrieve values using get() and dot notation. For example:

// Check if "Try It Out" is enabled:
$this->config->get('try_it_out.enabled');

You can specify a default that will be returned if the value does not exist. Otherwise, null will be returned.

$this->config->get('unknown_setting'); // Returns null
$this->config->get('unknown_setting', true); // Returns true

__invoke(ExtractedEndpointData $endpointData, array $settings): ?array
This is the method that is called to process a route. Parameters:

$endpointData, an instance of Knuckles\Camel\Extraction\ExtractedEndpointData (source), which contains information about the endpoint being processed.
$settings, the settings passed to the strategy.
This method may return null or an empty array if it has no data to add. Otherwise, it should return an array with the relevant information, which varies depending on the type of strategy/stage of route processing:

For metadata, a map (key => value) of metadata attributes (as shown in the example below). If you'd like to set a custom attribute so you can access it later, you can add items to the $endpointData->metadata->custom array directly.

return [
  'groupName' => 'User management',
  'groupDescription' => 'APIs to manage users.',
  'title' => 'Shadowban a user',
  'description' => "Temporarily restrict a user's account",
  'authenticated' => true,
  'custom' => [],
];

For headers, a map (key => value) of headers and values.

return [
  'Api-Version' => null,
  'Content-Type' => 'application/xml',
];

For urlParameters, queryParameters, and bodyParameters, a map (key => value) of parameters. Each parameter may specify a type, description, example, and a required flag.

return [
  'room_id' => [
    'type' => 'string',
    'description' => '',
    'example' => 'r4oiu78t63ns3',
    'required' => true, 
  ]
];

You may also add any custom data you wish to pass around in a custom field.

return [
  'submission_date' => [
    'type' => 'string',
    'example' => '2021-02-03T01:00:00Z',
    'required' => true, 
    'custom' => [
      'format' => 'datetime'
    ]
  ]
];

note
Setting a parameter to required => false and example => null tells Scribe to omit it from example requests. It will still be present in the main docs.

For responses, a list of one or more responses.
return [
  [
    'status' => 201,
    'headers' => ['sample-header' => 'sample-value'],
    'description' => 'Operation successful.',
    'content' => '{"room": {"id": "r4oiu78t63ns3"}}',
  ],
];

note
The return values from each strategy are merged with the existing extracted data. This means a later strategy can overwrite an earlier one. The exception here is the responses stage. The responses from all strategies will be kept. Responses will not overwrite each other, even if they have the same status code.

If you need to overwrite previous responses, modify the $endpointData->responses object directly (but this is at your own risk).

### Hooks
Scribe allows you to modify its behaviour in many ways. Some ways are very obvious, like in the config file and via annotations (see the pages in the Documenting your API category in the sidebar). Others are more involved, like writing custom strategies and customising the views (the pages under Advanced Customization).

However, a useful in-between is hooks. Hooks are a way for you to run a task before or after Scribe does something. You can achieve some of that in other ways, but hooks provide a convenient point in the context of your app and allow you to harness the full power of Laravel.

Scribe currently provides six hooks:

bootstrap()
beforeResponseCall()
afterResponseCall()
afterGenerating()
normalizeEndpointUrlUsing()
instantiateFormRequestUsing()
To define a hook, call these methods and pass in a callback where you do whatever. Typically, you'd do this in the boot() method of your AppServiceProvider.

caution
Always wrap these method calls in an if (class_exists(\Knuckles\Scribe\Scribe::class)) statement. That way, you can push this code to production safely, even if Scribe is installed in dev only.

bootstrap()
bootstrap() allows you to run some code when the generate command is starting up. You can use this to update service container bindings, inspect the command instance properties or whatever you wish.

The callback you provide will be passed an instance of the GenerateDocumentation command.

app\Providers\AppServiceProvider.php

use Knuckles\Scribe\Commands\GenerateDocumentation;
use Knuckles\Scribe\Scribe;
use Event;

public function boot()
{
  if (class_exists(\Knuckles\Scribe\Scribe::class)) {
    Scribe::bootstrap(function (GenerateDocumentation $command) {
        Event::fake();
    });
  }
}

beforeResponseCall()
beforeResponseCall() allows you to run some code before a response call is dispatched. You can use this to fix authentication, add parameters, or whatever you wish.

The callback you provide will be passed the current Symfony\Component\HttpFoundation\Request instance and the details of the current endpoint being extracted. If you have database transactions configured, they will already be activated at that point, allowing you to modify your database freely, and have your changes rolled back after the request.

app\Providers\AppServiceProvider.php

use Knuckles\Camel\Extraction\ExtractedEndpointData;
use Knuckles\Scribe\Scribe;
use Symfony\Component\HttpFoundation\Request;

public function boot()
{
  if (class_exists(\Knuckles\Scribe\Scribe::class)) {
    Scribe::beforeResponseCall(function (Request $request, ExtractedEndpointData $endpointData) {
      // Customise the request however you want (e.g. custom authentication)
      $token = User::first()->api_token;
      
      $request->headers->set("Authorization", "Bearer $token");
      // You also need to set the headers in $_SERVER
      $request->server->set("HTTP_AUTHORIZATION", "Bearer $token");
    });
  }
}

afterResponseCall()
afterResponseCall() allows you to run some code after getting the the response. You can modify the result to reduce size of examples, remove sensibles data, or whatever you wish.

app\Providers\AppServiceProvider.php

use Illuminate\Http\JsonResponse;
use Knuckles\Camel\Extraction\ExtractedEndpointData;
use Knuckles\Scribe\Scribe;
use Symfony\Component\HttpFoundation\Request;

public function boot()
{
  if (class_exists(\Knuckles\Scribe\Scribe::class)) {
    Scribe::afterResponseCall(function (Request $request, ExtractedEndpointData $endpointData, JsonResponse $jsonResponse) {
      // Customise the response however you want
      $json = $jsonResponse->getData();

      // For example, reduce number elements in data array (if existing) of the response to 5 maximum 
      if (!empty($json->data) && is_array($json->data) && count($json->data) > 5) {
        $json->data = array_slice($json->data, 0, 5);
        $jsonResponse->setData($json);
      }
    });
  }
}


afterGenerating()
afterGenerating() allows you to run some code after Scribe is done generating your docs; for instance, upload your generated docs to AWS S3, change some of the content, etc. You could do the same with a shell script, but by using afterGenerating(), you get to stay in PHP land, complete with all Laravel's goodness.

The callback you provide will be passed a map of the output paths generated.

app\Providers\AppServiceProvider.php

use Knuckles\Scribe\Scribe;

public function boot()
{
  if (class_exists(\Knuckles\Scribe\Scribe::class)) {
    Scribe::afterGenerating(function (array $paths) {
      dump($paths);
      // Move the files, upload to S3, etc...
      rename($paths['postman'], "some/where/else");
      Storage::disk('s3')->put('collection.json', file_get_contents($paths['postman']));
    });
  }
}

Here's an example of the $paths array passed to the callback.

[
  "postman" => "C:\Users\shalvah\Projects\TheSideProjectAPI\punlic\docs\collection.json"
  "openapi" => "C:\Users\shalvah\Projects\TheSideProjectAPI\punlic\docs\openapi.yaml"
  "html" => "C:\Users\shalvah\Projects\TheSideProjectAPI\docs\index.html"
  "blade" => null
  "assets" => [
    "js" => "C:\Users\shalvah\Projects\TheSideProjectAPI\docs\css"
    "css" => "C:\Users\shalvah\Projects\TheSideProjectAPI\docs\js"
    "images" => "C:\Users\shalvah\Projects\TheSideProjectAPI\docs\images"
  ]
]

Notes:

The paths in "js", "css", and "images" paths point to the respective folders. All other paths point to specific files.
If you're using laravel type, "html" will be null, and "blade" will contain the index.blade.php path.
If you're using static type, "blade" will be null, and "html" will contain the index.html path.
If you disabled Postman and/or OpenAPI generation, those paths will be null.
Paths are generated using PHP's realpath(), so they'll use the appropriate directory separator for your platform (backslash on Windows, forwards slash on *nix).
normalizeEndpointUrlUsing()
Laravel provides some shortcuts for writing endpoint paths, especially when using resource routes or model binding. For instance,Route::apiResource('users.projects') generates routes to create, update, view, list and delete a project resources. However, the generated parameter names aren't always obvious to non-Laravel end users. In this example, we get URLS like users/{user}/projects/{project}, and it isn't obvious what the parameters mean. Is the{project} the project ID? HashId? Slug?

Scribe tries to make things clear by normalizing endpoint URLs. By default, Scribe will rewrite this example to users/{user_id}/projects/{id}. If your model uses something other than id for routing, Scribe will try to figure that out instead, based on things such as the model's routeKeyName or the key specified in the URL.

If you aren't happy with the results of this normalization, you can use the normalizeEndpointUrlUsing() hook to override it. Specify a callback that will be called when the ExtractedEndpointData object is being instantiated. The callback will be passed the default Laravel URL, the route object, the controller method and class (where available). You also get a $default callable that lets you fall back to Scribe's default.

app\Providers\AppServiceProvider.php
use Knuckles\Scribe\Scribe;
use Illuminate\Routing\Route;

public function boot()
{
  if (class_exists(Scribe::class)) {
    Scribe::normalizeEndpointUrlUsing(
      function (string $url, Route $route, \ReflectionFunctionAbstract $method,
        ?\ReflectionClass $controller, callable $default
      ) {
        if ($url == 'things/{thing}') 
          return 'things/{the_id_of_the_thing}';
    
        return match ($route->name) {
          'things.otherthings.destroy' => 'things/{thing-id}/otherthings/{other_thing-id}',
          default => $default(),
        };
    });
  }
}

If you don't want URL normalization, you can disable it completely:

Scribe::normalizeEndpointUrlUsing(fn($url) => $url);

instantiateFormRequestUsing()
instantiateFormRequestUsing() allows you to customise how FormRequests are created by the FormRequest strategies. By default, these strategies simply call new $yourFormRequestClass. This means if you're using Laravel's constructor or method injection, your dependencies won't be resolved properly, and certain request-specific functionality may not work. If that's the case, you can use this hook to override how the FormRequest is created.

The callback you provide will be passed the name of the FormRequest class, the current Laravel route being processed, and the controller method. Your callback should return a FormRequest instance.

app\Providers\AppServiceProvider.php

use Knuckles\Scribe\Scribe;
use Illuminate\Routing\Route;
use ReflectionFunctionAbstract;

public function boot()
{
  if (class_exists(Scribe::class)) {
    Scribe::instantiateFormRequestUsing(function (string $formRequestClassName, Route $route, ReflectionFunctionAbstract $method) {
      return new $formRequestClassName(app('someDependency'));
    });
  }
}

### Troubleshooting and Debugging
This page contains a few tips to help you figure out what's wrong when Scribe seems to be malfunctioning.

Update your version
First off, try updating your installed Scribe version. Maybe your problem is due to a bug we've fixed in a newer release. You can see a list of releases and major changes on the changelog.

To see the exact installed version, run composer show knuckleswtf/scribe
To update to the latest version, run composer update knuckleswtf/scribe.
To update to a specific version (example: 4.0.1), run composer update knuckleswtf/scribe:4.0.1.
Use --verbose
By default, Scribe will try to keep going until it processes all routes and generates your docs. If it encounters any problems while processing a route (such as a missing @responseFile or some invalid configuration leading to an exception being thrown), it will output a warning and the exception message, then move on to the next route.

You can turn on debug messages (such as the path Scribe takes in instantiating a model) and full stack traces with the --verbose flag:

php artisan scribe:generate --verbose

Make sure you aren't matching web routes
Routes defined in Laravel's web.php typically have the web middleware, leading to strange behaviour, so make sure you've correctly specified the routes to be matched in your config file. See this GitHub issue.

Turn on debug mode for your app
Sometimes you may see a 500 null response shown in the generated examples. This is usually because an error occurred within your application during a response call. The quickest way to debug this is by setting app.debug to true in your response_calls.config section in your scribe.php file.

Alternatively, you can set APP_DEBUG=true in your .env.docs file and run php artisan scribe:generate --env docs.

Clear any cached Laravel config
Sometimes Laravel caches config files, and this may lead to Scribe failing with an error about a null DocumentationConfig. To fix this, clear the config cache:

php artisan config:clear

Clear cached view templates
Sometimes Laravel caches view templates, and this may lead to your API changes not being reflected in the output. To fix this, clear the view cache:

php artisan view:clear

Clear previously generated docs
Sometimes you may run into conflicts if you switch from one output type to another. While we try to prevent this happening, we don't guarantee it. In such cases, please try clearing the old docs generated from your previous run (laravel would be in resources/docs and storage/docs, static would be in public/docs) and then running again. We recommend copying these out to a different location, just to be safe.

Increase the memory
Generating docs for large APIs can be memory-intensive. If you run into memory limits, try running PHP with an increased memory limit (either by updating your CLI php.ini file or using a CLI flag):

php -d memory_limit=1G artisan scribe:generate

Delete old published templates
The default view templates may be modified between versions, so if you published the templates before upgrading your Scribe version, you might be using an outdated templates (and you might see a JavaScript error in your browser console or experience other weird behaviour). You'll need to re-publish the templates and redo any custom changes.

tip
After publishing templates, you can delete the ones you don't wish to customise. That way, you easily know which templates you're overriding.

Common problems
TypeError: hljs.highlightElement / hljs.highlightAll is not a function
This is a frontend error. It usually happens when you're using another tool like Laravel Debug Bar, which loads a conflicting version of highlight.js. To fix, exclude your docs route in your config/debugbar.php:

'except' => [
  'docs',
],

Some weird behaviour when using FormRequests
FormRequests are not initialized by Scribe in the same way as Laravel would, so you can easily run into issues. See if using the instantiateFormRequestUsing() hook solves your problem.

### Example requests
For each endpoint, an example request is shown in each language in your config. If you aren't happy with the generated examples, you can change the template Scribe uses. You can also add a language which isn't included with Scribe by creating your own Blade template.

In this guide, we'll try it out by creating a template for Ruby. If you just want to edit an existing template, you should follow along, as it's almost exactly the same process.

Step 1: Create template file
First, create a file called {language-code}.md.blade.php in the resources/views/vendor/scribe/partials/example-requests directory. Since we're creating a Ruby template, we'll create in this case, ruby.md.blade.php.

If you're editing an existing template, you can copy the one Scribe uses to create your own template.

tip
You can also run php artisan vendor:publish --tag=scribe-examples instead to automatically copy all Scribe's example templates to the vendor views directory. Note that this will publish all the example templates.

Step 2: Write the template
In this Blade template, you'll write the Markdown for the example request. You have access to two variables, $baseUrl and $endpoint.

$baseUrl is the base URL for the API (for instance, http://your-api.dev).

$endpoint contains details about the current endpoint. It's an instance of Knuckles\Camel\Output\OutputEndpointData with the following properties:

httpMethods: an array of the HTTP methods for that endpoint
boundUri: the URL for the endpoint, with any url parameters replaced (users/{id} -> users/1)
headers: key-value array of request headers
cleanQueryParameters: key-value array of query parameters and examples
cleanBodyParameters: key-value array of body parameters and examples
fileParameters: key-value array of file parameters and examples. Each example is an instance of \Illuminate\Http\UploadedFile.
note
Parameters which have been excluded from the example requests (see Specifying example values) will not be present in cleanQueryParameters, cleanBodyParameters, or fileParameters.

We can work with this information to write a basic Ruby template:

resources/views/vendor/scribe/ruby.md.blade.php
@php
    // Adding this so we get IDE code completion for $endpoint
    /** @var \Knuckles\Camel\Output\OutputEndpointData $endpoint */
@endphp
```ruby

require 'rest-client'

@if(!empty($endpoint->cleanBodyParameters))
body = {!! json_encode($endpoint->cleanBodyParameters, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) !!}
@endif
@if(!empty($endpoint->headers))
headers = {
@foreach($endpoint->headers as $header => $value)
    "{{$header}}": "{{$value}}",
@endforeach
}
@endif

response = RestClient.{{strtolower($endpoint->httpMethods[0])}}(
  '{{ $baseUrl }}/{{ $endpoint->boundUri }}'@if(!empty($endpoint->cleanBodyParameters)),
  body @endif
@if(!empty($endpoint->headers)),
  headers
@endif
)

p response.body


As you can see, it's a regular Blade view, so we can use the usual Blade directives and constructs.

If you need more examples, you can check out the included example requests.

tip
The Knuckles\Scribe\Tools\WritingUtils class contains some helpful utilities that might save you some work; for instance, printing query parameters as a key-value hash.

Step 3: Add to config
Finally, if you added a new language template, add the language to the example_languages array in your config and generate your documentation as usual. If you want to use a specific name for the language you can provide it as the array key.

config/scribe.php
'example_languages' => [
  'javascript',
  'ruby', // or 'Ruby 3' => 'ruby',
]

Now run php artisan scribe:generate, and your example requests should include a ruby (or Ruby 3) tab:

### Writing plugins
You can use plugins as an alternative way to provide Scribe with more information about your endpoints.

For instance, suppose all your GET endpoints support pagination query parameters pageSize and page, and you don't want to annotate with @queryParam on each method. You can create a plugin that adds this to all your query parameters. Let's see how to do this.

The stages of route processing
First, it's important to know the stages of route processing:

metadata (this includes title, description, groupName, groupDescription, and authentication status (authenticated))
urlParameters
queryParameters
headers (headers to be added to example requests and response calls)
bodyParameters
responses
responseFields (descriptions of fields in the response)
At each stage, the Extractor attempts to use various "strategies" to fetch data. The Extractor will call all the strategies configured in scribe.php, merging their results together to produce the final output of that stage. Later strategies can overwrite or add to the results of earlier strategies.

note
Unlike other stages, the responses stage is additive. This means that all responses from all strategies will be saved. Responses cannot overwrite each other, even if they have the same status code. By contrast, if you return a value for a body parameter from one strategy, it will overwrite any data for that parameter gotten from previous strategies.

There are a number of strategies included with the package, so you don't have to set up anything to get it working.

tip
Check out our community wiki for a list of strategies contributed by the community.

Creating a strategy
To create a strategy, create a class that extends \Knuckles\Scribe\Extracting\Strategies\Strategy. You can do this manually, or by running the scribe:strategy command.

php artisan scribe:strategy AddPaginationParameters

This will create a class like this in your app\Docs\Strategies folder:

app\Docs\Strategies\AddPaginationParameters.php
namespace App\Docs\Strategies;

use Knuckles\Scribe\Extracting\ParamHelpers;
use Knuckles\Scribe\Extracting\Strategies\Strategy;
use Knuckles\Camel\Extraction\ExtractedEndpointData;

class AddPaginationParameters extends Strategy
{
    /**
     * Trait containing some helper methods for dealing with "parameters".
     * Useful if your strategy extracts information about parameters.
     */
    use ParamHelpers;

    /**
     * @param ExtractedEndpointData $endpointData The endpoint we are currently processing.
     *   Contains details about httpMethods, controller, method, route, url, etc, as well as already extracted data.
     * @param array $settings Settings to be applied to this strategy.
     *
     * @return array|null
     */
    public function __invoke(ExtractedEndpointData $endpointData, array $settings = []): ?array
    {
        return [];
    }

}


Alternatively, if you're creating a strategy that you'd like people to download and install via Composer, you can generate one from this GitHub template.

Writing strategies
Let's take a look at the contents of our Strategy class. There's a detailed plugin API reference (and you should check it out), but the important thing is the __invoke method. This is where our logic goes.

Let's add some code to make our strategy work:

app\Docs\Strategies\AddPaginationParameters.php

public function __invoke(ExtractedEndpointData $endpointData, array $settings = []): ?array
{
    $isGetRoute = in_array('GET', $endpointData->httpMethods);
    $isIndexRoute = strpos($endpointData->route->getName(), '.index') !== false;
    if ($isGetRoute && $isIndexRoute) {
        return [
            'page' => [
                'description' => 'Page number to return.',
                'required' => false,
                'example' => 1,
            ],
            'pageSize' => [
                'description' => 'Number of items to return in a page. Defaults to 10.',
                'required' => false,
                'example' => null, // We don't want it to show in examples
            ],
        ];
    }

    return null;
}

So what's going on here? We're checking if the endpoint if a GET endpoint using the $endpointData object. Then we also check for the route name, via $endpointData->route. And finally we return the parameter info.

Note that we set our pageSize to reuired => false and example => null. This tells Scribe to omit it from example requests. It will still be present in the main docs.

Using your strategy
The final step is to register the strategy in our config:.

config/scribe.php
    'strategies' => [
        // ...
        'queryParameters' => [
            \Strategies\QueryParameters\GetFromQueryParamTag::class,
            \App\Docs\Strategies\AddPaginationParameters::class,
        ],
    ],

tip
You can also publish your strategy as a Composer package. Then others can install them via composer require and register them in their own config.

And we're done! Now, when we run php artisan scribe:generate, all our GET routes that end with .index will have the pagination parameters added. Here we go!



See the plugin API reference for details of what's available when writing plugins.

Working with settings
All strategies can receive an array of settings. In the configuration file, this can be done using the inherited wrapWithSettings method. This is useful for many scenarios. For instance, we can specify the pagination type for specific endpoints.

config/scribe.php
'strategies' => [
  'queryParameters' => [
    \Strategies\QueryParameters\GetFromQueryParamTag::class,
    \App\Docs\Strategies\AddPaginationParameters::wrapWithSettings(
      only: ['GET *'],
      except: ['GET /me'],
      otherSettings: ['paginationType' => 'cursor'],
    ),
  ],
],

In this case:

Your strategy will only be called for endpoints matching the only and except rules (ie the rules are evaluated before the strategy is invoked).
Your strategy will be called with a $settings array that looks like this:
[
   'paginationType' => 'cursor'
],

Within the strategy, you can then adjust behaviour based on the provided settings.

tip
This approach is used by the StaticData strategy, which returns whatever is provided in the data setting, and by the ResponseCalls strategy, which makes use of the bodyParams, fileParams, queryParams, cookies, and config.

Utilities
When developing strategies, you have access to a few useful tools:

Accessing doc blocks
You can use the RouteDocBlocker class to fetch docblocks for a route (method and class). It has this interface:

namespace Knuckles\Scribe\Extracting;

use Illuminate\Routing\Route;
use Mpociot\Reflection\DocBlock;

class RouteDocBlocker
{
    /**
     * @param Route $route
     *
     * @return array<"method"|"class", DocBlock> Method and class docblocks
     */
    public static function getDocBlocksFromRoute(Route $route): array;
}

You pass in a route (from $endpointData->route), and you get an array with two keys, method and class, containing the docblocks for the method and controller handling the route respectively (instances of \Mpociot\Reflection\DocBlock).

This allows you to implement your own custom tags. For instance, a @usesPagination annotation:


public function __invoke(ExtractedEndpointData $endpointData, array $settings = []): ?array
{
    $methodDocBlock = RouteDocBlocker::getDocBlocksFromRoute($endpointData->route)['method'];
    $tags = $methodDocBlock->getTagsByName('usesPagination');

    if (empty($tags)) {
        // Doesn't use pagination
        return [];
    }

    return [
        'page' => [
            'description' => 'Page number to return.',
            'required' => false,
            'example' => 1,
        ],
        'pageSize' => [
            'description' => 'Number of items to return in a page. Defaults to 10.',
            'required' => false,
            'example' => null, // So it doesn't get included in the examples
        ],
    ];
}

And in your controller method:

class UserController
{
    /**
     * @usesPagination
     */
     }
    public function index()
    {
        // ...
    }
}

### How Scribe works
Read this page if you want a deeper understanding of how Scribe works (for instance, for the purpose of contributing).

When you run scribe:generate for the first time
Here's a high-level overview of what Scribe does on first run:

The GenerateDocumentationCommand calls the RouteMatcher class to get the routes you want to document. The RouteMatcher does this by fetching all your application's routes from the Laravel router and filtering them based on your config.
$routes = $routeMatcher->getRoutes($yourConfig);

Next, the Extractor processes each route and uses your configured strategies to extract info about it—metadata (eg name and description), parameters, and sample responses.

$endpoints = $this->extractEndpointsInfoFromLaravelApp($yourRoutes);

After that, the endpoints are grouped (based on their @group tags). The grouping makes it easy for Scribe to loop over them and generate the output.

$groupedEndpoints = Camel::groupEndpoints($endpoints);

The grouped endpoints are written to a bunch of YAML files, in a .scribe/endpoints directory in your app. We don't need them right now, but we'll come back to those files later. See What are those YAML files for?

Alright, the extraction phase is done. Over to output.

When it's time for output, we call the Writer class, and pass in those grouped endpoints. It uses a couple of Blade templates to generate the HTML output.

Finally, the writer copies the generated HTMl, plus the included CSS and JS to your configured static.output_path folder (typically public/docs), and your docs are ready!

If you enabled Postman or OpenAPI generation, the writer will also generate those. If you chose laravel-type docs, the writer will convert the generated HTMl back into Blade files, and move them into the resources/views/scribe folder.

On subsequent runs
On subsequent runs, the same thing happens. The only difference is that Scribe first checks to see if there are any YAML files present. If there are, it merges whatever it finds there with what it can extract from your endpoints.

Now, about those YAML files...

What are those YAML files for?
Earlier, we said that the grouped endpoints are written to some YAML files, in a .scribe/endpoints directory in your app. Each group of endpoints goes into one file, and looks like this:

<your-app>/.scribe/endpoints/0.yaml
name: 'Name of the group'
description: A description for the group.
endpoints:
- httpMethods: ["POST"]
  uri: api/stuff
  metadata:
    title: Do stuff
    description: 
    authenticated: false
  headers:
    Content-Type: application/json
  urlParameters: []
  queryParameters: []
  bodyParameters:
    a_param:
      name: a_param
      description: Something something
      required: true
      example: something
      type: string
  responses:
  - status: 200
    content: '{"hey": "there"}'
    headers: []
    description: '200, Success'
  responseFields: []

Internally, we call these Camel files, and they're very useful! They're intermediate output, which means they let you modify the data Scribe has extracted, before Scribe goes on to convert to HTML. This means:

You can edit an endpoint's details. For instance, if Scribe made a mistake, or wasn't able to figure out some data, you can just find the YAML file and edit it. Then when you run scribe:generate again, Scribe will use your changes instead of what it figured out.
tip
You can run php artisan scribe:generate --no-extraction for Scribe to completely skip the extraction step and just use the YAML files.

You can sort your endpoints. If you want one endpoint to appear before another, just edit the endpoints key in the YAML and arrange them how you prefer.

You can also sort groups. You'll notice the example above is 0.yaml. To sort groups, just rename the files how you wish, since it's one group per file. For instance, if I rename this file to 1.yaml, and another file to 0.yaml, that group will appear before this one in the docs.

You can add new endpoints. This is useful if you're using a package that adds extra routes (like Laravel Passport), and you want to document those. Custom endpoint files use a slightly different format from regular endpoints, so Scribe automatically adds an example custom.0.yaml file to the .scribe/endpoints folder, and you can edit it to add additional endpoints.

The .scribe folder
The .scribe folder contains intermediate output—information about your API that Scribe has extracted.

.scribe/
|- endpoints/
   |- 0.yaml
   |- 1.yaml
   |- custom.0.yaml
|- endpoints.cache/
   |- 0.yaml
   |- 1.yaml
|- auth.md
|- intro.md
|- .filehashes


The endpoints folder holds the endpoints information as YAML files. You can edit them to add/overwrite endpoints.
The endpoints.cache folder also holds endpoints information, but these files are not meant to be edited by the user. Scribe uses the files here to figure out when you've edited something in endpoints.
The auth.md and intro.md files contain the generated text for the "Authentication" and "Introduction" section of your docs. You can edit these.
The .filehashes file is how Scribe keeps track of changes you make to auth.md and intro.md.
Scribe regenerates the .scribe folder on every run, while preserving any changes you've made to endpoints or Markdown files. Special cases:

When you specify --no-extraction, Scribe will not go through an extraction phase or regenerate the folder. Instead, it will use the information here to generate the output (HTML, Postman, OpenAPI).
When you specify --force, Scribe will overwrite your changes to this folder.