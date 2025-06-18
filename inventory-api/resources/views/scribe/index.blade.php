<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta content="IE=edge,chrome=1" http-equiv="X-UA-Compatible">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>Laravel API Documentation</title>

    <link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{{ asset("/vendor/scribe/css/theme-default.style.css") }}" media="screen">
    <link rel="stylesheet" href="{{ asset("/vendor/scribe/css/theme-default.print.css") }}" media="print">

    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.10/lodash.min.js"></script>

    <link rel="stylesheet"
          href="https://unpkg.com/@highlightjs/cdn-assets@11.6.0/styles/obsidian.min.css">
    <script src="https://unpkg.com/@highlightjs/cdn-assets@11.6.0/highlight.min.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jets/0.14.1/jets.min.js"></script>

    <style id="language-style">
        /* starts out as display none and is replaced with js later  */
                    body .content .bash-example code { display: none; }
                    body .content .javascript-example code { display: none; }
            </style>

    <script>
        var tryItOutBaseUrl = "http://localhost:8000";
        var useCsrf = Boolean();
        var csrfUrl = "/sanctum/csrf-cookie";
    </script>
    <script src="{{ asset("/vendor/scribe/js/tryitout-5.2.1.js") }}"></script>

    <script src="{{ asset("/vendor/scribe/js/theme-default-5.2.1.js") }}"></script>

</head>

<body data-languages="[&quot;bash&quot;,&quot;javascript&quot;]">

<a href="#" id="nav-button">
    <span>
        MENU
        <img src="{{ asset("/vendor/scribe/images/navbar.png") }}" alt="navbar-image"/>
    </span>
</a>
<div class="tocify-wrapper">
    
            <div class="lang-selector">
                                            <button type="button" class="lang-button" data-language-name="bash">bash</button>
                                            <button type="button" class="lang-button" data-language-name="javascript">javascript</button>
                    </div>
    
    <div class="search">
        <input type="text" class="search" id="input-search" placeholder="Search">
    </div>

    <div id="toc">
                    <ul id="tocify-header-introduction" class="tocify-header">
                <li class="tocify-item level-1" data-unique="introduction">
                    <a href="#introduction">Introduction</a>
                </li>
                            </ul>
                    <ul id="tocify-header-authenticating-requests" class="tocify-header">
                <li class="tocify-item level-1" data-unique="authenticating-requests">
                    <a href="#authenticating-requests">Authenticating requests</a>
                </li>
                            </ul>
                    <ul id="tocify-header-endpoints" class="tocify-header">
                <li class="tocify-item level-1" data-unique="endpoints">
                    <a href="#endpoints">Endpoints</a>
                </li>
                                    <ul id="tocify-subheader-endpoints" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="endpoints-GETapi-health">
                                <a href="#endpoints-GETapi-health">健康檢查端點
用於確認 API 服務正常運行</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="endpoints-GETapi-user">
                                <a href="#endpoints-GETapi-user">獲取當前已認證的使用者資訊</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="endpoints-POSTapi-purchases">
                                <a href="#endpoints-POSTapi-purchases">Store a newly created resource in storage.</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="endpoints-POSTapi-categories">
                                <a href="#endpoints-POSTapi-categories">儲存新建立的分類資源</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="endpoints-GETapi-categories--id-">
                                <a href="#endpoints-GETapi-categories--id-">顯示指定的分類資源</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="endpoints-PUTapi-categories--id-">
                                <a href="#endpoints-PUTapi-categories--id-">更新指定的分類資源</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="endpoints-DELETEapi-categories--id-">
                                <a href="#endpoints-DELETEapi-categories--id-">刪除指定的分類資源</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-store-management" class="tocify-header">
                <li class="tocify-item level-1" data-unique="store-management">
                    <a href="#store-management">Store Management</a>
                </li>
                                    <ul id="tocify-subheader-store-management" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="store-management-GETapi-stores">
                                <a href="#store-management-GETapi-stores">GET api/stores</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="store-management-POSTapi-stores">
                                <a href="#store-management-POSTapi-stores">POST api/stores</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="store-management-GETapi-stores--id-">
                                <a href="#store-management-GETapi-stores--id-">GET api/stores/{id}</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="store-management-PUTapi-stores--id-">
                                <a href="#store-management-PUTapi-stores--id-">PUT api/stores/{id}</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="store-management-DELETEapi-stores--id-">
                                <a href="#store-management-DELETEapi-stores--id-">DELETE api/stores/{id}</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-user-store-management" class="tocify-header">
                <li class="tocify-item level-1" data-unique="user-store-management">
                    <a href="#user-store-management">User Store Management</a>
                </li>
                                    <ul id="tocify-subheader-user-store-management" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="user-store-management-GETapi-users--user_id--stores">
                                <a href="#user-store-management-GETapi-users--user_id--stores">GET api/users/{user_id}/stores</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="user-store-management-POSTapi-users--user_id--stores">
                                <a href="#user-store-management-POSTapi-users--user_id--stores">POST api/users/{user_id}/stores</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">分類管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-categories">
                                <a href="#-GETapi-categories">顯示分類列表</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">商品屬性管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-attributes">
                                <a href="#-GETapi-attributes">獲取所有屬性列表</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-attributes">
                                <a href="#-POSTapi-attributes">創建新屬性</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-attributes--id-">
                                <a href="#-GETapi-attributes--id-">獲取指定屬性</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-PUTapi-attributes--id-">
                                <a href="#-PUTapi-attributes--id-">更新指定屬性</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-DELETEapi-attributes--id-">
                                <a href="#-DELETEapi-attributes--id-">刪除指定屬性</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">商品管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-POSTapi-products-batch-delete">
                                <a href="#-POSTapi-products-batch-delete">批量刪除商品</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-products--product_id--upload-image">
                                <a href="#-POSTapi-products--product_id--upload-image">上傳商品圖片</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-products">
                                <a href="#-GETapi-products">顯示所有商品列表，支援分頁、排序和篩選功能</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-products">
                                <a href="#-POSTapi-products">建立新商品 (SPU/SKU)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-products--id-">
                                <a href="#-GETapi-products--id-">顯示指定的商品</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-PUTapi-products--id-">
                                <a href="#-PUTapi-products--id-">更新指定的商品及其變體</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-DELETEapi-products--id-">
                                <a href="#-DELETEapi-products--id-">刪除指定的商品</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">商品變體管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-products-variants">
                                <a href="#-GETapi-products-variants">獲取商品變體列表</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-products-variants--id-">
                                <a href="#-GETapi-products-variants--id-">獲取單個商品變體詳情</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">屬性值管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-attributes--attribute_id--values">
                                <a href="#-GETapi-attributes--attribute_id--values">獲取指定屬性的所有值</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-attributes--attribute_id--values">
                                <a href="#-POSTapi-attributes--attribute_id--values">為指定屬性創建新值</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-values--id-">
                                <a href="#-GETapi-values--id-">獲取指定屬性值</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-DELETEapi-values--id-">
                                <a href="#-DELETEapi-values--id-">刪除指定屬性值</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">庫存管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-inventory">
                                <a href="#-GETapi-inventory">獲取庫存列表</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-inventory--id-">
                                <a href="#-GETapi-inventory--id-">獲取單條庫存記錄詳情</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-inventory-adjust">
                                <a href="#-POSTapi-inventory-adjust">調整庫存</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-inventory--id--history">
                                <a href="#-GETapi-inventory--id--history">獲取庫存交易歷史</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-inventory-batch-check">
                                <a href="#-POSTapi-inventory-batch-check">批量獲取多個商品變體的庫存情況</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">庫存轉移</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-inventory-transfers">
                                <a href="#-GETapi-inventory-transfers">獲取庫存轉移記錄列表</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-inventory-transfers--id-">
                                <a href="#-GETapi-inventory-transfers--id-">獲取單筆庫存轉移記錄</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-inventory-transfers">
                                <a href="#-POSTapi-inventory-transfers">創建庫存轉移記錄並執行轉移</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-PATCHapi-inventory-transfers--id--status">
                                <a href="#-PATCHapi-inventory-transfers--id--status">更新庫存轉移記錄狀態</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-PATCHapi-inventory-transfers--id--cancel">
                                <a href="#-PATCHapi-inventory-transfers--id--cancel">取消庫存轉移</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">用戶管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-GETapi-users">
                                <a href="#-GETapi-users">顯示用戶列表</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-users">
                                <a href="#-POSTapi-users">建立新用戶</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-GETapi-users--id-">
                                <a href="#-GETapi-users--id-">顯示指定用戶</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-PUTapi-users--id-">
                                <a href="#-PUTapi-users--id-">更新指定用戶</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-DELETEapi-users--id-">
                                <a href="#-DELETEapi-users--id-">刪除指定用戶</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">規格庫管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-PUTapi-values--id-">
                                <a href="#-PUTapi-values--id-">更新指定的屬性值</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-" class="tocify-header">
                <li class="tocify-item level-1" data-unique="">
                    <a href="#">認證管理</a>
                </li>
                                    <ul id="tocify-subheader-" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="-POSTapi-login">
                                <a href="#-POSTapi-login">處理使用者登入請求</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="-POSTapi-logout">
                                <a href="#-POSTapi-logout">處理使用者登出請求</a>
                            </li>
                                                                        </ul>
                            </ul>
            </div>

    <ul class="toc-footer" id="toc-footer">
                    <li style="padding-bottom: 5px;"><a href="{{ route("scribe.postman") }}">View Postman collection</a></li>
                            <li style="padding-bottom: 5px;"><a href="{{ route("scribe.openapi") }}">View OpenAPI spec</a></li>
                <li><a href="http://github.com/knuckleswtf/scribe">Documentation powered by Scribe ✍</a></li>
    </ul>

    <ul class="toc-footer" id="last-updated">
        <li>Last updated: June 18, 2025</li>
    </ul>
</div>

<div class="page-wrapper">
    <div class="dark-box"></div>
    <div class="content">
        <h1 id="introduction">Introduction</h1>
<aside>
    <strong>Base URL</strong>: <code>http://localhost:8000</code>
</aside>
<pre><code>This documentation aims to provide all the information you need to work with our API.

&lt;aside&gt;As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile).
You can switch the language used with the tabs at the top right (or from the nav menu at the top left on mobile).&lt;/aside&gt;</code></pre>

        <h1 id="authenticating-requests">Authenticating requests</h1>
<p>This API is not authenticated.</p>

        <h1 id="endpoints">Endpoints</h1>

    

                                <h2 id="endpoints-GETapi-health">健康檢查端點
用於確認 API 服務正常運行</h2>

<p>
</p>



<span id="example-requests-GETapi-health">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/health" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/health"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-health">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
vary: Origin
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;status&quot;: &quot;ok&quot;,
    &quot;message&quot;: &quot;API is running&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-health" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-health"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-health"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-health" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-health">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-health" data-method="GET"
      data-path="api/health"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-health', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-health"
                    onclick="tryItOut('GETapi-health');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-health"
                    onclick="cancelTryOut('GETapi-health');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-health"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/health</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-health"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-health"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="endpoints-GETapi-user">獲取當前已認證的使用者資訊</h2>

<p>
</p>



<span id="example-requests-GETapi-user">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/user" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/user"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-user">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 16,
        &quot;name&quot;: &quot;Mrs. Justina Gaylord&quot;,
        &quot;username&quot;: &quot;lafayette.considine&quot;,
        &quot;role&quot;: &quot;viewer&quot;,
        &quot;role_display&quot;: &quot;檢視者&quot;,
        &quot;is_admin&quot;: false,
        &quot;created_at&quot;: &quot;2025-06-18T01:24:06.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-18T01:24:06.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-user" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-user"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-user"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-user" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-user">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-user" data-method="GET"
      data-path="api/user"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-user', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-user"
                    onclick="tryItOut('GETapi-user');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-user"
                    onclick="cancelTryOut('GETapi-user');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-user"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/user</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-user"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-user"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="endpoints-POSTapi-purchases">Store a newly created resource in storage.</h2>

<p>
</p>



<span id="example-requests-POSTapi-purchases">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/purchases" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/purchases"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-purchases">
            <blockquote>
            <p>Example response (201):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;id&quot;: 1,
    &quot;order_number&quot;: &quot;PO-20240101-001&quot;,
    &quot;total_amount&quot;: 150,
    &quot;status&quot;: &quot;pending&quot;,
    &quot;purchased_at&quot;: &quot;2024-01-01T00:00:00+08:00&quot;,
    &quot;items&quot;: []
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-purchases" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-purchases"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-purchases"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-purchases" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-purchases">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-purchases" data-method="POST"
      data-path="api/purchases"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-purchases', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-purchases"
                    onclick="tryItOut('POSTapi-purchases');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-purchases"
                    onclick="cancelTryOut('POSTapi-purchases');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-purchases"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/purchases</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-purchases"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-purchases"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="endpoints-POSTapi-categories">儲存新建立的分類資源</h2>

<p>
</p>

<p>使用 StoreCategoryRequest 進行數據驗證，確保：</p>
<ul>
<li>分類名稱必填且不超過255字符</li>
<li>父分類ID必須存在於資料表中</li>
<li>描述為可選欄位</li>
</ul>

<span id="example-requests-POSTapi-categories">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/categories" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\",
    \"description\": \"Eius et animi quos velit et.\",
    \"parent_id\": 16
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/categories"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto",
    "description": "Eius et animi quos velit et.",
    "parent_id": 16
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-categories">
</span>
<span id="execution-results-POSTapi-categories" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-categories"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-categories"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-categories" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-categories">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-categories" data-method="POST"
      data-path="api/categories"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-categories', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-categories"
                    onclick="tryItOut('POSTapi-categories');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-categories"
                    onclick="cancelTryOut('POSTapi-categories');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-categories"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/categories</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-categories"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-categories"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="POSTapi-categories"
               value="architecto"
               data-component="body">
    <br>
<p>分類名稱。例如：電子產品 Example: <code>architecto</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="description"                data-endpoint="POSTapi-categories"
               value="Eius et animi quos velit et."
               data-component="body">
    <br>
<p>分類描述。例如：包含所有電子相關產品 Example: <code>Eius et animi quos velit et.</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>parent_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="parent_id"                data-endpoint="POSTapi-categories"
               value="16"
               data-component="body">
    <br>
<p>父分類ID，必須是存在的分類ID。例如：1 Example: <code>16</code></p>
        </div>
        </form>

                    <h2 id="endpoints-GETapi-categories--id-">顯示指定的分類資源</h2>

<p>
</p>

<p>返回單一分類的詳細資訊，使用 CategoryResource 格式化輸出</p>

<span id="example-requests-GETapi-categories--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/categories/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/categories/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-categories--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
vary: Origin
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;message&quot;: &quot;Unauthenticated.&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-categories--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-categories--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-categories--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-categories--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-categories--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-categories--id-" data-method="GET"
      data-path="api/categories/{id}"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-categories--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-categories--id-"
                    onclick="tryItOut('GETapi-categories--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-categories--id-"
                    onclick="cancelTryOut('GETapi-categories--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-categories--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/categories/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-categories--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-categories--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-categories--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the category. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="endpoints-PUTapi-categories--id-">更新指定的分類資源</h2>

<p>
</p>

<p>使用 UpdateCategoryRequest 進行數據驗證，包含：</p>
<ul>
<li>部分更新支援（sometimes 規則）</li>
<li>防止自我循環的業務邏輯保護</li>
<li>確保父分類存在性檢查</li>
</ul>

<span id="example-requests-PUTapi-categories--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/categories/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\",
    \"description\": \"Eius et animi quos velit et.\",
    \"parent_id\": 16
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/categories/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto",
    "description": "Eius et animi quos velit et.",
    "parent_id": 16
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-categories--id-">
</span>
<span id="execution-results-PUTapi-categories--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-categories--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-categories--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-categories--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-categories--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-categories--id-" data-method="PUT"
      data-path="api/categories/{id}"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-categories--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-categories--id-"
                    onclick="tryItOut('PUTapi-categories--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-categories--id-"
                    onclick="cancelTryOut('PUTapi-categories--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-categories--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/categories/{id}</code></b>
        </p>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/categories/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-categories--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-categories--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PUTapi-categories--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the category. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="PUTapi-categories--id-"
               value="architecto"
               data-component="body">
    <br>
<p>分類名稱。例如：電子產品 Example: <code>architecto</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="description"                data-endpoint="PUTapi-categories--id-"
               value="Eius et animi quos velit et."
               data-component="body">
    <br>
<p>分類描述。例如：包含所有電子相關產品 Example: <code>Eius et animi quos velit et.</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>parent_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="parent_id"                data-endpoint="PUTapi-categories--id-"
               value="16"
               data-component="body">
    <br>
<p>父分類ID，必須是存在的分類ID且不能是自己。例如：1 Example: <code>16</code></p>
        </div>
        </form>

                    <h2 id="endpoints-DELETEapi-categories--id-">刪除指定的分類資源</h2>

<p>
</p>

<p>執行軟刪除操作，根據資料表外鍵約束設定：</p>
<ul>
<li>當分類被刪除時，其子分類也會被級聯刪除</li>
<li>關聯的商品 category_id 會被設為 null</li>
</ul>

<span id="example-requests-DELETEapi-categories--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request DELETE \
    "http://localhost:8000/api/categories/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/categories/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "DELETE",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-DELETEapi-categories--id-">
</span>
<span id="execution-results-DELETEapi-categories--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-DELETEapi-categories--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-DELETEapi-categories--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-DELETEapi-categories--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-DELETEapi-categories--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-DELETEapi-categories--id-" data-method="DELETE"
      data-path="api/categories/{id}"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('DELETEapi-categories--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-DELETEapi-categories--id-"
                    onclick="tryItOut('DELETEapi-categories--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-DELETEapi-categories--id-"
                    onclick="cancelTryOut('DELETEapi-categories--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-DELETEapi-categories--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-red">DELETE</small>
            <b><code>api/categories/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="DELETEapi-categories--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="DELETEapi-categories--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="DELETEapi-categories--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the category. Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="store-management">Store Management</h1>

    

                                <h2 id="store-management-GETapi-stores">GET api/stores</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-stores">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/stores" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/stores"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-stores">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;台北旗艦店&quot;,
            &quot;address&quot;: &quot;台北市信義區信義路四段101號&quot;,
            &quot;phone&quot;: &quot;02-2345-6789&quot;,
            &quot;email&quot;: &quot;taipei@example.com&quot;,
            &quot;manager&quot;: &quot;張經理&quot;,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
        },
        {
            &quot;id&quot;: 2,
            &quot;name&quot;: &quot;台中中區店&quot;,
            &quot;address&quot;: &quot;台中市中區中山路123號&quot;,
            &quot;phone&quot;: &quot;04-2345-6789&quot;,
            &quot;email&quot;: &quot;taichung@example.com&quot;,
            &quot;manager&quot;: &quot;李經理&quot;,
            &quot;created_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/stores?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/stores?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/stores&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 2
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-stores" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-stores"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-stores"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-stores" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-stores">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-stores" data-method="GET"
      data-path="api/stores"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-stores', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-stores"
                    onclick="tryItOut('GETapi-stores');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-stores"
                    onclick="cancelTryOut('GETapi-stores');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-stores"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/stores</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="store-management-POSTapi-stores">POST api/stores</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-stores">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/stores" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\",
    \"address\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/stores"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto",
    "address": "architecto"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-stores">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 11,
        &quot;name&quot;: &quot;Bailey Ltd&quot;,
        &quot;address&quot;: &quot;85625 Gaylord Knolls\nCecilburgh, WI 02042&quot;,
        &quot;created_at&quot;: &quot;2025-06-18T01:24:07.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-18T01:24:07.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-stores" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-stores"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-stores"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-stores" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-stores">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-stores" data-method="POST"
      data-path="api/stores"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-stores', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-stores"
                    onclick="tryItOut('POSTapi-stores');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-stores"
                    onclick="cancelTryOut('POSTapi-stores');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-stores"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/stores</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="POSTapi-stores"
               value="architecto"
               data-component="body">
    <br>
<p>分店名稱（唯一）。例如：台北總店 Example: <code>architecto</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>address</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="address"                data-endpoint="POSTapi-stores"
               value="architecto"
               data-component="body">
    <br>
<p>分店地址。例如：台北市信義區信義路五段7號 Example: <code>architecto</code></p>
        </div>
        </form>

                    <h2 id="store-management-GETapi-stores--id-">GET api/stores/{id}</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-stores--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/stores/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/stores/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-stores--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 12,
        &quot;name&quot;: &quot;Cruickshank Inc&quot;,
        &quot;address&quot;: &quot;532 Leuschke Causeway\nMcLaughlinstad, MI 07365&quot;,
        &quot;created_at&quot;: &quot;2025-06-18T01:24:07.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-18T01:24:07.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-stores--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-stores--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-stores--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-stores--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-stores--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-stores--id-" data-method="GET"
      data-path="api/stores/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-stores--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-stores--id-"
                    onclick="tryItOut('GETapi-stores--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-stores--id-"
                    onclick="cancelTryOut('GETapi-stores--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-stores--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/stores/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-stores--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-stores--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-stores--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the store. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="store-management-PUTapi-stores--id-">PUT api/stores/{id}</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-stores--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/stores/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\",
    \"address\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/stores/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto",
    "address": "architecto"
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-stores--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 13,
        &quot;name&quot;: &quot;Rempel, Gulgowski and O&#039;Kon&quot;,
        &quot;address&quot;: &quot;80841 Mya Lane Apt. 042\nLyricberg, MO 42170-0432&quot;,
        &quot;created_at&quot;: &quot;2025-06-18T01:24:08.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-18T01:24:08.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-PUTapi-stores--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-stores--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-stores--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-stores--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-stores--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-stores--id-" data-method="PUT"
      data-path="api/stores/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-stores--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-stores--id-"
                    onclick="tryItOut('PUTapi-stores--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-stores--id-"
                    onclick="cancelTryOut('PUTapi-stores--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-stores--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/stores/{id}</code></b>
        </p>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/stores/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-stores--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-stores--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PUTapi-stores--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the store. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="PUTapi-stores--id-"
               value="architecto"
               data-component="body">
    <br>
<p>分店名稱（唯一，會排除當前分店）。例如：台北信義店 Example: <code>architecto</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>address</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="address"                data-endpoint="PUTapi-stores--id-"
               value="architecto"
               data-component="body">
    <br>
<p>分店地址。例如：台北市信義區信義路五段7號 Example: <code>architecto</code></p>
        </div>
        </form>

                    <h2 id="store-management-DELETEapi-stores--id-">DELETE api/stores/{id}</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-DELETEapi-stores--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request DELETE \
    "http://localhost:8000/api/stores/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/stores/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "DELETE",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-DELETEapi-stores--id-">
</span>
<span id="execution-results-DELETEapi-stores--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-DELETEapi-stores--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-DELETEapi-stores--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-DELETEapi-stores--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-DELETEapi-stores--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-DELETEapi-stores--id-" data-method="DELETE"
      data-path="api/stores/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('DELETEapi-stores--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-DELETEapi-stores--id-"
                    onclick="tryItOut('DELETEapi-stores--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-DELETEapi-stores--id-"
                    onclick="cancelTryOut('DELETEapi-stores--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-DELETEapi-stores--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-red">DELETE</small>
            <b><code>api/stores/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="DELETEapi-stores--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="DELETEapi-stores--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="DELETEapi-stores--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the store. Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="user-store-management">User Store Management</h1>

    

                                <h2 id="user-store-management-GETapi-users--user_id--stores">GET api/users/{user_id}/stores</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-users--user_id--stores">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/users/1/stores" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users/1/stores"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-users--user_id--stores">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 14,
        &quot;name&quot;: &quot;Hauck-Leuschke&quot;,
        &quot;address&quot;: &quot;544 Aglae Ridge Apt. 067\nLefflerhaven, TX 58408-7043&quot;,
        &quot;created_at&quot;: &quot;2025-06-18T01:24:08.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-18T01:24:08.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-users--user_id--stores" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-users--user_id--stores"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-users--user_id--stores"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-users--user_id--stores" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-users--user_id--stores">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-users--user_id--stores" data-method="GET"
      data-path="api/users/{user_id}/stores"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-users--user_id--stores', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-users--user_id--stores"
                    onclick="tryItOut('GETapi-users--user_id--stores');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-users--user_id--stores"
                    onclick="cancelTryOut('GETapi-users--user_id--stores');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-users--user_id--stores"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/users/{user_id}/stores</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-users--user_id--stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-users--user_id--stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user_id"                data-endpoint="GETapi-users--user_id--stores"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="user-store-management-POSTapi-users--user_id--stores">POST api/users/{user_id}/stores</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-users--user_id--stores">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/users/1/stores" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"store_ids\": [
        \"architecto\"
    ]
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users/1/stores"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "store_ids": [
        "architecto"
    ]
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-users--user_id--stores">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 17,
        &quot;name&quot;: &quot;Ms. Elisabeth Okuneva&quot;,
        &quot;username&quot;: &quot;gulgowski.asia&quot;,
        &quot;role&quot;: &quot;viewer&quot;,
        &quot;role_display&quot;: &quot;檢視者&quot;,
        &quot;is_admin&quot;: false,
        &quot;created_at&quot;: &quot;2025-06-18T01:24:08.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-18T01:24:08.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-users--user_id--stores" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-users--user_id--stores"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-users--user_id--stores"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-users--user_id--stores" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-users--user_id--stores">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-users--user_id--stores" data-method="POST"
      data-path="api/users/{user_id}/stores"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-users--user_id--stores', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-users--user_id--stores"
                    onclick="tryItOut('POSTapi-users--user_id--stores');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-users--user_id--stores"
                    onclick="cancelTryOut('POSTapi-users--user_id--stores');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-users--user_id--stores"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/users/{user_id}/stores</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-users--user_id--stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-users--user_id--stores"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user_id"                data-endpoint="POSTapi-users--user_id--stores"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>store_ids</code></b>&nbsp;&nbsp;
<small>string[]</small>&nbsp;
 &nbsp;
<br>
<p>要分配給用戶的分店ID列表。例如：[1, 2, 3]</p>
            </summary>
                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>*</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="store_ids.*"                data-endpoint="POSTapi-users--user_id--stores"
               value="16"
               data-component="body">
    <br>
<p>分店ID，必須存在於系統中。例如：1 Example: <code>16</code></p>
                    </div>
                                    </details>
        </div>
        </form>

                <h1 id="">分類管理</h1>

    

                                <h2 id="-GETapi-categories">顯示分類列表</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>優化策略：返回一個以 parent_id 分組的集合，讓前端可以極其方便地、
高效地建構層級樹，而無需自己在前端進行複雜的遞迴或查找。</p>
<p>範例：</p>
<ul>
<li>json[''] 或 json[null] 就是所有頂層分類</li>
<li>json['1'] 就是 id 為 1 的分類下的所有子分類</li>
</ul>

<span id="example-requests-GETapi-categories">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/categories" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/categories"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-categories">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;辦公用品&quot;,
            &quot;description&quot;: &quot;各種辦公室所需用品&quot;,
            &quot;parent_id&quot;: null,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
        },
        {
            &quot;id&quot;: 2,
            &quot;name&quot;: &quot;辦公椅&quot;,
            &quot;description&quot;: &quot;各式辦公椅系列&quot;,
            &quot;parent_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;
        },
        {
            &quot;id&quot;: 3,
            &quot;name&quot;: &quot;電腦周邊&quot;,
            &quot;description&quot;: &quot;電腦相關配件&quot;,
            &quot;parent_id&quot;: null,
            &quot;created_at&quot;: &quot;2024-01-03T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-03T10:00:00.000000Z&quot;
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/categories?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/categories?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/categories&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 3,
        &quot;total&quot;: 3
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-categories" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-categories"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-categories"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-categories" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-categories">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-categories" data-method="GET"
      data-path="api/categories"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-categories', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-categories"
                    onclick="tryItOut('GETapi-categories');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-categories"
                    onclick="cancelTryOut('GETapi-categories');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-categories"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/categories</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-categories"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-categories"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                <h1 id="">商品屬性管理</h1>

    

                                <h2 id="-GETapi-attributes">獲取所有屬性列表</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>返回系統中所有的商品屬性，包含其相關的屬性值
使用 Eager Loading 避免 N+1 查詢問題</p>

<span id="example-requests-GETapi-attributes">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/attributes" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-attributes">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;顏色&quot;,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;values&quot;: [
                {
                    &quot;id&quot;: 1,
                    &quot;value&quot;: &quot;紅色&quot;,
                    &quot;attribute_id&quot;: 1,
                    &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
                },
                {
                    &quot;id&quot;: 2,
                    &quot;value&quot;: &quot;藍色&quot;,
                    &quot;attribute_id&quot;: 1,
                    &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
                }
            ]
        },
        {
            &quot;id&quot;: 2,
            &quot;name&quot;: &quot;尺寸&quot;,
            &quot;created_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;,
            &quot;values&quot;: [
                {
                    &quot;id&quot;: 3,
                    &quot;value&quot;: &quot;S&quot;,
                    &quot;attribute_id&quot;: 2,
                    &quot;created_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;
                },
                {
                    &quot;id&quot;: 4,
                    &quot;value&quot;: &quot;M&quot;,
                    &quot;attribute_id&quot;: 2,
                    &quot;created_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-02T10:00:00.000000Z&quot;
                }
            ]
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/attributes?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/attributes?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/attributes&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 2
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-attributes" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-attributes"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-attributes"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-attributes" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-attributes">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-attributes" data-method="GET"
      data-path="api/attributes"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-attributes', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-attributes"
                    onclick="tryItOut('GETapi-attributes');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-attributes"
                    onclick="cancelTryOut('GETapi-attributes');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-attributes"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/attributes</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-attributes"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-attributes"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="-POSTapi-attributes">創建新屬性</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>創建一個新的商品屬性，屬性名稱必須唯一</p>

<span id="example-requests-POSTapi-attributes">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/attributes" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-attributes">
            <blockquote>
            <p>Example response (201):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">App\Http\Resources\Api\V1\AttributeResource</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-attributes" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-attributes"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-attributes"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-attributes" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-attributes">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-attributes" data-method="POST"
      data-path="api/attributes"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-attributes', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-attributes"
                    onclick="tryItOut('POSTapi-attributes');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-attributes"
                    onclick="cancelTryOut('POSTapi-attributes');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-attributes"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/attributes</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-attributes"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-attributes"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="POSTapi-attributes"
               value="architecto"
               data-component="body">
    <br>
<p>屬性名稱（唯一）。例如：顏色 Example: <code>architecto</code></p>
        </div>
        </form>

                    <h2 id="-GETapi-attributes--id-">獲取指定屬性</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>返回指定的商品屬性詳細資訊，包含其所有屬性值</p>

<span id="example-requests-GETapi-attributes--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/attributes/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-attributes--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">App\Http\Resources\Api\V1\AttributeResource</code>
 </pre>
    </span>
<span id="execution-results-GETapi-attributes--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-attributes--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-attributes--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-attributes--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-attributes--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-attributes--id-" data-method="GET"
      data-path="api/attributes/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-attributes--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-attributes--id-"
                    onclick="tryItOut('GETapi-attributes--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-attributes--id-"
                    onclick="cancelTryOut('GETapi-attributes--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-attributes--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/attributes/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-attributes--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-attributes--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-attributes--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the attribute. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute"                data-endpoint="GETapi-attributes--id-"
               value="1"
               data-component="url">
    <br>
<p>屬性 ID Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="-PUTapi-attributes--id-">更新指定屬性</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>更新指定的商品屬性，屬性名稱必須唯一（忽略當前屬性）</p>

<span id="example-requests-PUTapi-attributes--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/attributes/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto"
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-attributes--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">App\Http\Resources\Api\V1\AttributeResource</code>
 </pre>
    </span>
<span id="execution-results-PUTapi-attributes--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-attributes--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-attributes--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-attributes--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-attributes--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-attributes--id-" data-method="PUT"
      data-path="api/attributes/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-attributes--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-attributes--id-"
                    onclick="tryItOut('PUTapi-attributes--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-attributes--id-"
                    onclick="cancelTryOut('PUTapi-attributes--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-attributes--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/attributes/{id}</code></b>
        </p>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/attributes/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-attributes--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-attributes--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PUTapi-attributes--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the attribute. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute"                data-endpoint="PUTapi-attributes--id-"
               value="1"
               data-component="url">
    <br>
<p>屬性 ID Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="PUTapi-attributes--id-"
               value="architecto"
               data-component="body">
    <br>
<p>屬性名稱（唯一，會排除當前屬性）。例如：尺寸 Example: <code>architecto</code></p>
        </div>
        </form>

                    <h2 id="-DELETEapi-attributes--id-">刪除指定屬性</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>刪除指定的商品屬性及其所有相關的屬性值
注意：如果有商品變體正在使用此屬性的值，刪除操作可能會失敗</p>

<span id="example-requests-DELETEapi-attributes--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request DELETE \
    "http://localhost:8000/api/attributes/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "DELETE",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-DELETEapi-attributes--id-">
            <blockquote>
            <p>Example response (204):</p>
        </blockquote>
                <pre>
<code>Empty response</code>
 </pre>
    </span>
<span id="execution-results-DELETEapi-attributes--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-DELETEapi-attributes--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-DELETEapi-attributes--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-DELETEapi-attributes--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-DELETEapi-attributes--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-DELETEapi-attributes--id-" data-method="DELETE"
      data-path="api/attributes/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('DELETEapi-attributes--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-DELETEapi-attributes--id-"
                    onclick="tryItOut('DELETEapi-attributes--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-DELETEapi-attributes--id-"
                    onclick="cancelTryOut('DELETEapi-attributes--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-DELETEapi-attributes--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-red">DELETE</small>
            <b><code>api/attributes/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="DELETEapi-attributes--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="DELETEapi-attributes--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="DELETEapi-attributes--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the attribute. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute"                data-endpoint="DELETEapi-attributes--id-"
               value="1"
               data-component="url">
    <br>
<p>屬性 ID Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="">商品管理</h1>

    

                                <h2 id="-POSTapi-products-batch-delete">批量刪除商品</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>根據提供的商品 ID 陣列批量刪除商品。</p>

<span id="example-requests-POSTapi-products-batch-delete">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/products/batch-delete" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"ids\": [
        \"architecto\"
    ]
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/batch-delete"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "ids": [
        "architecto"
    ]
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-products-batch-delete">
            <blockquote>
            <p>Example response (204):</p>
        </blockquote>
                <pre>
<code>Empty response</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-products-batch-delete" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-products-batch-delete"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-products-batch-delete"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-products-batch-delete" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-products-batch-delete">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-products-batch-delete" data-method="POST"
      data-path="api/products/batch-delete"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-products-batch-delete', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-products-batch-delete"
                    onclick="tryItOut('POSTapi-products-batch-delete');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-products-batch-delete"
                    onclick="cancelTryOut('POSTapi-products-batch-delete');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-products-batch-delete"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/products/batch-delete</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-products-batch-delete"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-products-batch-delete"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>ids</code></b>&nbsp;&nbsp;
<small>string[]</small>&nbsp;
 &nbsp;
<br>
<p>要刪除的商品 ID 列表。例如：[1, 2, 3]</p>
            </summary>
                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>*</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="ids.*"                data-endpoint="POSTapi-products-batch-delete"
               value="16"
               data-component="body">
    <br>
<p>商品 ID，必須存在於資料庫中。例如：1 Example: <code>16</code></p>
                    </div>
                                    </details>
        </div>
        </form>

                    <h2 id="-POSTapi-products--product_id--upload-image">上傳商品圖片</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>遵循 Spatie Media Library v11 官方最佳實踐：</p>
<ul>
<li>使用專用的 FormRequest 進行驗證</li>
<li>實施完整的錯誤處理和日誌記錄</li>
<li>使用 singleFile 行為自動替換現有圖片</li>
<li>返回所有轉換版本的 URL</li>
</ul>

<span id="example-requests-POSTapi-products--product_id--upload-image">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/products/1/upload-image" \
    --header "Content-Type: multipart/form-data" \
    --header "Accept: application/json" \
    --form "image=@C:\Users\Zou\AppData\Local\Temp\phpD444.tmp" </code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/1/upload-image"
);

const headers = {
    "Content-Type": "multipart/form-data",
    "Accept": "application/json",
};

const body = new FormData();
body.append('image', document.querySelector('input[name="image"]').files[0]);

fetch(url, {
    method: "POST",
    headers,
    body,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-products--product_id--upload-image">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;success&quot;: true,
    &quot;message&quot;: &quot;圖片上傳成功&quot;,
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;商品名稱&quot;,
        &quot;has_image&quot;: true,
        &quot;image_urls&quot;: {
            &quot;original&quot;: &quot;http://localhost:8000/storage/1/product-image.jpg&quot;,
            &quot;thumb&quot;: &quot;http://localhost:8000/storage/1/conversions/product-image-thumb.jpg&quot;,
            &quot;medium&quot;: &quot;http://localhost:8000/storage/1/conversions/product-image-medium.jpg&quot;,
            &quot;large&quot;: &quot;http://localhost:8000/storage/1/conversions/product-image-large.jpg&quot;
        }
    }
}</code>
 </pre>
            <blockquote>
            <p>Example response (404):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;success&quot;: false,
    &quot;message&quot;: &quot;找不到指定的商品&quot;
}</code>
 </pre>
            <blockquote>
            <p>Example response (422):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;success&quot;: false,
    &quot;message&quot;: &quot;圖片上傳驗證失敗&quot;,
    &quot;errors&quot;: {
        &quot;image&quot;: [
            &quot;圖片格式必須是：JPEG、JPG、PNG、GIF 或 WebP。&quot;
        ]
    }
}</code>
 </pre>
            <blockquote>
            <p>Example response (500):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;success&quot;: false,
    &quot;message&quot;: &quot;圖片上傳失敗&quot;,
    &quot;error&quot;: &quot;詳細錯誤訊息&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-products--product_id--upload-image" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-products--product_id--upload-image"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-products--product_id--upload-image"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-products--product_id--upload-image" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-products--product_id--upload-image">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-products--product_id--upload-image" data-method="POST"
      data-path="api/products/{product_id}/upload-image"
      data-authed="1"
      data-hasfiles="1"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-products--product_id--upload-image', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-products--product_id--upload-image"
                    onclick="tryItOut('POSTapi-products--product_id--upload-image');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-products--product_id--upload-image"
                    onclick="cancelTryOut('POSTapi-products--product_id--upload-image');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-products--product_id--upload-image"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/products/{product_id}/upload-image</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-products--product_id--upload-image"
               value="multipart/form-data"
               data-component="header">
    <br>
<p>Example: <code>multipart/form-data</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-products--product_id--upload-image"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>product_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="product_id"                data-endpoint="POSTapi-products--product_id--upload-image"
               value="1"
               data-component="url">
    <br>
<p>The ID of the product. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="POSTapi-products--product_id--upload-image"
               value="1"
               data-component="url">
    <br>
<p>商品 ID Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>image</code></b>&nbsp;&nbsp;
<small>file</small>&nbsp;
 &nbsp;
                <input type="file" style="display: none"
                              name="image"                data-endpoint="POSTapi-products--product_id--upload-image"
               value=""
               data-component="body">
    <br>
<p>圖片檔案 (支援 JPEG、PNG、GIF、WebP，最大 5MB) Example: <code>C:\Users\Zou\AppData\Local\Temp\phpD444.tmp</code></p>
        </div>
        </form>

                    <h2 id="-GETapi-products">顯示所有商品列表，支援分頁、排序和篩選功能</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-products">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/products?page=1&amp;per_page=15&amp;search=%E6%A4%85%E5%AD%90&amp;product_name=%E8%BE%A6%E5%85%AC%E6%A4%85&amp;store_id=1&amp;category_id=2&amp;low_stock=1&amp;out_of_stock=&amp;sort_by=name&amp;sort_order=desc" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products"
);

const params = {
    "page": "1",
    "per_page": "15",
    "search": "椅子",
    "product_name": "辦公椅",
    "store_id": "1",
    "category_id": "2",
    "low_stock": "1",
    "out_of_stock": "0",
    "sort_by": "name",
    "sort_order": "desc",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-products">
            <blockquote>
            <p>Example response (200, 商品列表):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;高階人體工學辦公椅&quot;,
            &quot;sku&quot;: &quot;CHAIR-ERG-001&quot;,
            &quot;description&quot;: &quot;具備可調節腰靠和 4D 扶手，提供全天候舒適支撐。&quot;,
            &quot;selling_price&quot;: 399.99,
            &quot;cost_price&quot;: 150,
            &quot;category_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
        },
        {
            &quot;id&quot;: 2,
            &quot;name&quot;: &quot;無線藍牙滑鼠&quot;,
            &quot;sku&quot;: &quot;MOUSE-BT-002&quot;,
            &quot;description&quot;: &quot;2.4GHz 無線連接，DPI 可調，適合辦公和遊戲。&quot;,
            &quot;selling_price&quot;: 79.99,
            &quot;cost_price&quot;: 25,
            &quot;category_id&quot;: null,
            &quot;created_at&quot;: &quot;2024-01-01T11:30:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T11:30:00.000000Z&quot;
        }
    ],
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 3,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 45
    },
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/products?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/products?page=3&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: &quot;http://localhost/api/products?page=2&quot;
    }
}</code>
 </pre>
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;高階人體工學辦公椅&quot;,
            &quot;description&quot;: &quot;具備可調節腰靠和 4D 扶手，提供全天候舒適支撐。&quot;,
            &quot;category_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;image_urls&quot;: {
                &quot;original&quot;: &quot;http://localhost/storage/1/office-chair-original.jpg&quot;,
                &quot;thumbnail&quot;: &quot;http://localhost/storage/1/conversions/office-chair-thumb.jpg&quot;,
                &quot;medium&quot;: &quot;http://localhost/storage/1/conversions/office-chair-medium.jpg&quot;,
                &quot;large&quot;: &quot;http://localhost/storage/1/conversions/office-chair-large.jpg&quot;
            },
            &quot;variants&quot;: [
                {
                    &quot;id&quot;: 1,
                    &quot;sku&quot;: &quot;CHAIR-ERG-001-BLACK&quot;,
                    &quot;price&quot;: 399.99,
                    &quot;product_id&quot;: 1,
                    &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                    &quot;attribute_values&quot;: [
                        {
                            &quot;id&quot;: 1,
                            &quot;value&quot;: &quot;黑色&quot;,
                            &quot;attribute_id&quot;: 1,
                            &quot;attribute&quot;: {
                                &quot;id&quot;: 1,
                                &quot;name&quot;: &quot;顏色&quot;
                            }
                        }
                    ]
                },
                {
                    &quot;id&quot;: 2,
                    &quot;sku&quot;: &quot;CHAIR-ERG-001-WHITE&quot;,
                    &quot;price&quot;: 429.99,
                    &quot;product_id&quot;: 1,
                    &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                    &quot;attribute_values&quot;: [
                        {
                            &quot;id&quot;: 2,
                            &quot;value&quot;: &quot;白色&quot;,
                            &quot;attribute_id&quot;: 1,
                            &quot;attribute&quot;: {
                                &quot;id&quot;: 1,
                                &quot;name&quot;: &quot;顏色&quot;
                            }
                        }
                    ]
                }
            ],
            &quot;price_range&quot;: {
                &quot;min&quot;: 399.99,
                &quot;max&quot;: 429.99,
                &quot;count&quot;: 2
            },
            &quot;category&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;辦公用品&quot;,
                &quot;description&quot;: &quot;各種辦公室所需用品&quot;
            }
        },
        {
            &quot;id&quot;: 2,
            &quot;name&quot;: &quot;無線藍牙滑鼠&quot;,
            &quot;description&quot;: &quot;2.4GHz 無線連接，DPI 可調，適合辦公和遊戲。&quot;,
            &quot;category_id&quot;: null,
            &quot;created_at&quot;: &quot;2024-01-01T11:30:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T11:30:00.000000Z&quot;,
            &quot;image_urls&quot;: {
                &quot;original&quot;: &quot;http://localhost/storage/2/bluetooth-mouse-original.jpg&quot;,
                &quot;thumbnail&quot;: &quot;http://localhost/storage/2/conversions/bluetooth-mouse-thumb.jpg&quot;,
                &quot;medium&quot;: &quot;http://localhost/storage/2/conversions/bluetooth-mouse-medium.jpg&quot;,
                &quot;large&quot;: &quot;http://localhost/storage/2/conversions/bluetooth-mouse-large.jpg&quot;
            },
            &quot;variants&quot;: [
                {
                    &quot;id&quot;: 3,
                    &quot;sku&quot;: &quot;MOUSE-BT-002&quot;,
                    &quot;price&quot;: 79.99,
                    &quot;product_id&quot;: 2,
                    &quot;created_at&quot;: &quot;2024-01-01T11:30:00.000000Z&quot;,
                    &quot;updated_at&quot;: &quot;2024-01-01T11:30:00.000000Z&quot;,
                    &quot;attribute_values&quot;: []
                }
            ],
            &quot;price_range&quot;: {
                &quot;min&quot;: 79.99,
                &quot;max&quot;: 79.99,
                &quot;count&quot;: 1
            }
        }
    ],
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 3,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 45
    },
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/products?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/products?page=3&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: &quot;http://localhost/api/products?page=2&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-products" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-products"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-products"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-products" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-products">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-products" data-method="GET"
      data-path="api/products"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-products', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-products"
                    onclick="tryItOut('GETapi-products');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-products"
                    onclick="cancelTryOut('GETapi-products');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-products"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/products</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-products"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-products"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-products"
               value="1"
               data-component="query">
    <br>
<p>頁碼，預設為 1。 Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>per_page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="per_page"                data-endpoint="GETapi-products"
               value="15"
               data-component="query">
    <br>
<p>每頁項目數，預設為 15。 Example: <code>15</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>search</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="search"                data-endpoint="GETapi-products"
               value="椅子"
               data-component="query">
    <br>
<p>搜尋商品名稱或 SKU。 Example: <code>椅子</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>product_name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="product_name"                data-endpoint="GETapi-products"
               value="辦公椅"
               data-component="query">
    <br>
<p>專門用於商品名稱模糊搜尋。 Example: <code>辦公椅</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="store_id"                data-endpoint="GETapi-products"
               value="1"
               data-component="query">
    <br>
<p>按特定門市篩選庫存。 Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>category_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="category_id"                data-endpoint="GETapi-products"
               value="2"
               data-component="query">
    <br>
<p>按商品分類篩選。 Example: <code>2</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>low_stock</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
                <label data-endpoint="GETapi-products" style="display: none">
            <input type="radio" name="low_stock"
                   value="1"
                   data-endpoint="GETapi-products"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-products" style="display: none">
            <input type="radio" name="low_stock"
                   value="0"
                   data-endpoint="GETapi-products"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>只顯示低庫存商品。 Example: <code>true</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>out_of_stock</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
                <label data-endpoint="GETapi-products" style="display: none">
            <input type="radio" name="out_of_stock"
                   value="1"
                   data-endpoint="GETapi-products"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-products" style="display: none">
            <input type="radio" name="out_of_stock"
                   value="0"
                   data-endpoint="GETapi-products"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>只顯示缺貨商品。 Example: <code>false</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sort_by</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="sort_by"                data-endpoint="GETapi-products"
               value="name"
               data-component="query">
    <br>
<p>排序欄位 (name, created_at)。 Example: <code>name</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sort_order</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="sort_order"                data-endpoint="GETapi-products"
               value="desc"
               data-component="query">
    <br>
<p>排序方向 (asc, desc)，預設為 asc。 Example: <code>desc</code></p>
            </div>
                </form>

                    <h2 id="-POSTapi-products">建立新商品 (SPU/SKU)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-products">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/products" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"\\\"經典棉質T-shirt\\\"\",
    \"description\": \"\\\"100% 純棉\\\"\",
    \"category_id\": 1,
    \"attributes\": [
        1,
        2
    ],
    \"variants\": [
        {
            \"sku\": \"HEADPHONE-BT-RED-L\",
            \"price\": 199.99,
            \"attribute_value_ids\": [
                16
            ]
        }
    ]
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "\"經典棉質T-shirt\"",
    "description": "\"100% 純棉\"",
    "category_id": 1,
    "attributes": [
        1,
        2
    ],
    "variants": [
        {
            "sku": "HEADPHONE-BT-RED-L",
            "price": 199.99,
            "attribute_value_ids": [
                16
            ]
        }
    ]
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-products">
            <blockquote>
            <p>Example response (201):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;高階人體工學辦公椅&quot;,
        &quot;description&quot;: &quot;具備可調節腰靠和 4D 扶手，提供全天候舒適支撐。&quot;,
        &quot;category_id&quot;: 1,
        &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
        &quot;image_urls&quot;: {
            &quot;original&quot;: &quot;http://localhost/storage/1/office-chair-original.jpg&quot;,
            &quot;thumbnail&quot;: &quot;http://localhost/storage/1/conversions/office-chair-thumb.jpg&quot;,
            &quot;medium&quot;: &quot;http://localhost/storage/1/conversions/office-chair-medium.jpg&quot;,
            &quot;large&quot;: &quot;http://localhost/storage/1/conversions/office-chair-large.jpg&quot;
        },
        &quot;variants&quot;: [
            {
                &quot;id&quot;: 1,
                &quot;sku&quot;: &quot;CHAIR-ERG-001-BLACK&quot;,
                &quot;price&quot;: 399.99,
                &quot;product_id&quot;: 1,
                &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;value&quot;: &quot;黑色&quot;,
                        &quot;attribute_id&quot;: 1,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    }
                ],
                &quot;inventory&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;quantity&quot;: 50,
                        &quot;low_stock_threshold&quot;: 10,
                        &quot;store&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;台北旗艦店&quot;
                        }
                    }
                ]
            },
            {
                &quot;id&quot;: 2,
                &quot;sku&quot;: &quot;CHAIR-ERG-001-WHITE&quot;,
                &quot;price&quot;: 429.99,
                &quot;product_id&quot;: 1,
                &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;value&quot;: &quot;白色&quot;,
                        &quot;attribute_id&quot;: 1,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    }
                ],
                &quot;inventory&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;quantity&quot;: 25,
                        &quot;low_stock_threshold&quot;: 5,
                        &quot;store&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;台北旗艦店&quot;
                        }
                    }
                ]
            }
        ],
        &quot;price_range&quot;: {
            &quot;min&quot;: 399.99,
            &quot;max&quot;: 429.99,
            &quot;count&quot;: 2
        },
        &quot;attributes&quot;: [
            {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;顏色&quot;,
                &quot;type&quot;: &quot;string&quot;,
                &quot;description&quot;: &quot;商品顏色選項&quot;
            }
        ],
        &quot;category&quot;: {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;辦公用品&quot;,
            &quot;description&quot;: &quot;各種辦公室所需用品&quot;
        }
    }
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-products" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-products"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-products"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-products" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-products">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-products" data-method="POST"
      data-path="api/products"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-products', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-products"
                    onclick="tryItOut('POSTapi-products');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-products"
                    onclick="cancelTryOut('POSTapi-products');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-products"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/products</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-products"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-products"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="POSTapi-products"
               value=""經典棉質T-shirt""
               data-component="body">
    <br>
<p>SPU 的名稱。 Example: <code>"經典棉質T-shirt"</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="description"                data-endpoint="POSTapi-products"
               value=""100% 純棉""
               data-component="body">
    <br>
<p>SPU 的描述。 Example: <code>"100% 純棉"</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>category_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="category_id"                data-endpoint="POSTapi-products"
               value="1"
               data-component="body">
    <br>
<p>分類ID。 Example: <code>1</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>integer[]</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attributes[0]"                data-endpoint="POSTapi-products"
               data-component="body">
        <input type="number" style="display: none"
               name="attributes[1]"                data-endpoint="POSTapi-products"
               data-component="body">
    <br>
<p>該 SPU 擁有的屬性 ID 陣列。</p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>variants</code></b>&nbsp;&nbsp;
<small>object[]</small>&nbsp;
 &nbsp;
<br>
<p>SKU 變體陣列，至少需要一項。</p>
            </summary>
                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>sku</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="variants.0.sku"                data-endpoint="POSTapi-products"
               value="HEADPHONE-BT-RED-L"
               data-component="body">
    <br>
<p>單一 SKU 變體的唯一庫存單位編號。. Must not be greater than 255 characters. Example: <code>HEADPHONE-BT-RED-L</code></p>
                    </div>
                                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>price</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.0.price"                data-endpoint="POSTapi-products"
               value="199.99"
               data-component="body">
    <br>
<p>單一 SKU 變體的價格。. Must be at least 0. Example: <code>199.99</code></p>
                    </div>
                                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>attribute_value_ids</code></b>&nbsp;&nbsp;
<small>integer[]</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.0.attribute_value_ids[0]"                data-endpoint="POSTapi-products"
               data-component="body">
        <input type="number" style="display: none"
               name="variants.0.attribute_value_ids[1]"                data-endpoint="POSTapi-products"
               data-component="body">
    <br>
<p>The <code>id</code> of an existing record in the attribute_values table.</p>
                    </div>
                                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>*</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>sku</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="variants.*.sku"                data-endpoint="POSTapi-products"
               value=""TSHIRT-RED-S""
               data-component="body">
    <br>
<p>SKU 的唯一編號。 Example: <code>"TSHIRT-RED-S"</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>price</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.*.price"                data-endpoint="POSTapi-products"
               value="299.99"
               data-component="body">
    <br>
<p>SKU 的價格。 Example: <code>299.99</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>attribute_value_ids</code></b>&nbsp;&nbsp;
<small>integer[]</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.*.attribute_value_ids[0]"                data-endpoint="POSTapi-products"
               data-component="body">
        <input type="number" style="display: none"
               name="variants.*.attribute_value_ids[1]"                data-endpoint="POSTapi-products"
               data-component="body">
    <br>
<p>組成此 SKU 的屬性值 ID 陣列。</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="-GETapi-products--id-">顯示指定的商品</h2>

<p>
</p>



<span id="example-requests-GETapi-products--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/products/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-products--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;高階人體工學辦公椅&quot;,
        &quot;description&quot;: &quot;具備可調節腰靠和 4D 扶手，提供全天候舒適支撐。&quot;,
        &quot;category_id&quot;: 1,
        &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
        &quot;image_urls&quot;: {
            &quot;original&quot;: &quot;http://localhost/storage/1/office-chair-original.jpg&quot;,
            &quot;thumbnail&quot;: &quot;http://localhost/storage/1/conversions/office-chair-thumb.jpg&quot;,
            &quot;medium&quot;: &quot;http://localhost/storage/1/conversions/office-chair-medium.jpg&quot;,
            &quot;large&quot;: &quot;http://localhost/storage/1/conversions/office-chair-large.jpg&quot;
        },
        &quot;variants&quot;: [
            {
                &quot;id&quot;: 1,
                &quot;sku&quot;: &quot;CHAIR-ERG-001-BLACK&quot;,
                &quot;price&quot;: 399.99,
                &quot;product_id&quot;: 1,
                &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;value&quot;: &quot;黑色&quot;,
                        &quot;attribute_id&quot;: 1,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    }
                ],
                &quot;inventory&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;quantity&quot;: 50,
                        &quot;low_stock_threshold&quot;: 10,
                        &quot;store&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;台北旗艦店&quot;
                        }
                    }
                ]
            },
            {
                &quot;id&quot;: 2,
                &quot;sku&quot;: &quot;CHAIR-ERG-001-WHITE&quot;,
                &quot;price&quot;: 429.99,
                &quot;product_id&quot;: 1,
                &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;value&quot;: &quot;白色&quot;,
                        &quot;attribute_id&quot;: 1,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    }
                ],
                &quot;inventory&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;quantity&quot;: 25,
                        &quot;low_stock_threshold&quot;: 5,
                        &quot;store&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;台北旗艦店&quot;
                        }
                    }
                ]
            }
        ],
        &quot;price_range&quot;: {
            &quot;min&quot;: 399.99,
            &quot;max&quot;: 429.99,
            &quot;count&quot;: 2
        },
        &quot;attributes&quot;: [
            {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;顏色&quot;,
                &quot;type&quot;: &quot;string&quot;,
                &quot;description&quot;: &quot;商品顏色選項&quot;
            }
        ],
        &quot;category&quot;: {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;辦公用品&quot;,
            &quot;description&quot;: &quot;各種辦公室所需用品&quot;
        }
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-products--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-products--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-products--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-products--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-products--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-products--id-" data-method="GET"
      data-path="api/products/{id}"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-products--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-products--id-"
                    onclick="tryItOut('GETapi-products--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-products--id-"
                    onclick="cancelTryOut('GETapi-products--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-products--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/products/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-products--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-products--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-products--id-"
               value="1"
               data-component="url">
    <br>
<p>商品的 ID。 Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="-PUTapi-products--id-">更新指定的商品及其變體</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-products--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/products/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"\\\"經典棉質T-shirt\\\"\",
    \"description\": \"\\\"100% 純棉\\\"\",
    \"category_id\": 1,
    \"attributes\": [
        1,
        2
    ],
    \"variants\": [
        {
            \"id\": 16,
            \"sku\": \"n\",
            \"price\": 84,
            \"attribute_value_ids\": [
                16
            ]
        }
    ]
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "\"經典棉質T-shirt\"",
    "description": "\"100% 純棉\"",
    "category_id": 1,
    "attributes": [
        1,
        2
    ],
    "variants": [
        {
            "id": 16,
            "sku": "n",
            "price": 84,
            "attribute_value_ids": [
                16
            ]
        }
    ]
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-products--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;高階人體工學辦公椅&quot;,
        &quot;description&quot;: &quot;具備可調節腰靠和 4D 扶手，提供全天候舒適支撐。&quot;,
        &quot;category_id&quot;: 1,
        &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
        &quot;image_urls&quot;: {
            &quot;original&quot;: &quot;http://localhost/storage/1/office-chair-original.jpg&quot;,
            &quot;thumbnail&quot;: &quot;http://localhost/storage/1/conversions/office-chair-thumb.jpg&quot;,
            &quot;medium&quot;: &quot;http://localhost/storage/1/conversions/office-chair-medium.jpg&quot;,
            &quot;large&quot;: &quot;http://localhost/storage/1/conversions/office-chair-large.jpg&quot;
        },
        &quot;variants&quot;: [
            {
                &quot;id&quot;: 1,
                &quot;sku&quot;: &quot;CHAIR-ERG-001-BLACK&quot;,
                &quot;price&quot;: 399.99,
                &quot;product_id&quot;: 1,
                &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;value&quot;: &quot;黑色&quot;,
                        &quot;attribute_id&quot;: 1,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    }
                ],
                &quot;inventory&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;quantity&quot;: 50,
                        &quot;low_stock_threshold&quot;: 10,
                        &quot;store&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;台北旗艦店&quot;
                        }
                    }
                ]
            },
            {
                &quot;id&quot;: 2,
                &quot;sku&quot;: &quot;CHAIR-ERG-001-WHITE&quot;,
                &quot;price&quot;: 429.99,
                &quot;product_id&quot;: 1,
                &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;value&quot;: &quot;白色&quot;,
                        &quot;attribute_id&quot;: 1,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    }
                ],
                &quot;inventory&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;quantity&quot;: 25,
                        &quot;low_stock_threshold&quot;: 5,
                        &quot;store&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;台北旗艦店&quot;
                        }
                    }
                ]
            }
        ],
        &quot;price_range&quot;: {
            &quot;min&quot;: 399.99,
            &quot;max&quot;: 429.99,
            &quot;count&quot;: 2
        },
        &quot;attributes&quot;: [
            {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;顏色&quot;,
                &quot;type&quot;: &quot;string&quot;,
                &quot;description&quot;: &quot;商品顏色選項&quot;
            }
        ],
        &quot;category&quot;: {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;辦公用品&quot;,
            &quot;description&quot;: &quot;各種辦公室所需用品&quot;
        }
    }
}</code>
 </pre>
    </span>
<span id="execution-results-PUTapi-products--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-products--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-products--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-products--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-products--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-products--id-" data-method="PUT"
      data-path="api/products/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-products--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-products--id-"
                    onclick="tryItOut('PUTapi-products--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-products--id-"
                    onclick="cancelTryOut('PUTapi-products--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-products--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/products/{id}</code></b>
        </p>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/products/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-products--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-products--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PUTapi-products--id-"
               value="1"
               data-component="url">
    <br>
<p>商品的 ID。 Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="PUTapi-products--id-"
               value=""經典棉質T-shirt""
               data-component="body">
    <br>
<p>SPU 的名稱。 Example: <code>"經典棉質T-shirt"</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="description"                data-endpoint="PUTapi-products--id-"
               value=""100% 純棉""
               data-component="body">
    <br>
<p>SPU 的描述。 Example: <code>"100% 純棉"</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>category_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="category_id"                data-endpoint="PUTapi-products--id-"
               value="1"
               data-component="body">
    <br>
<p>分類ID。 Example: <code>1</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>integer[]</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attributes[0]"                data-endpoint="PUTapi-products--id-"
               data-component="body">
        <input type="number" style="display: none"
               name="attributes[1]"                data-endpoint="PUTapi-products--id-"
               data-component="body">
    <br>
<p>該 SPU 擁有的屬性 ID 陣列。</p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>variants</code></b>&nbsp;&nbsp;
<small>object[]</small>&nbsp;
<i>optional</i> &nbsp;
<br>
<p>SKU 變體陣列。</p>
            </summary>
                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.0.id"                data-endpoint="PUTapi-products--id-"
               value="16"
               data-component="body">
    <br>
<p>The <code>id</code> of an existing record in the product_variants table. Example: <code>16</code></p>
                    </div>
                                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>sku</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="variants.0.sku"                data-endpoint="PUTapi-products--id-"
               value="n"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>n</code></p>
                    </div>
                                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>price</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.0.price"                data-endpoint="PUTapi-products--id-"
               value="84"
               data-component="body">
    <br>
<p>Must be at least 0. Example: <code>84</code></p>
                    </div>
                                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>attribute_value_ids</code></b>&nbsp;&nbsp;
<small>integer[]</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.0.attribute_value_ids[0]"                data-endpoint="PUTapi-products--id-"
               data-component="body">
        <input type="number" style="display: none"
               name="variants.0.attribute_value_ids[1]"                data-endpoint="PUTapi-products--id-"
               data-component="body">
    <br>
<p>The <code>id</code> of an existing record in the attribute_values table.</p>
                    </div>
                                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>*</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.*.id"                data-endpoint="PUTapi-products--id-"
               value="1"
               data-component="body">
    <br>
<p>變體的 ID（用於更新現有變體）。 Example: <code>1</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>sku</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="variants.*.sku"                data-endpoint="PUTapi-products--id-"
               value=""TSHIRT-RED-S""
               data-component="body">
    <br>
<p>SKU 的唯一編號。 Example: <code>"TSHIRT-RED-S"</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>price</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.*.price"                data-endpoint="PUTapi-products--id-"
               value="299.99"
               data-component="body">
    <br>
<p>SKU 的價格。 Example: <code>299.99</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>attribute_value_ids</code></b>&nbsp;&nbsp;
<small>integer[]</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="variants.*.attribute_value_ids[0]"                data-endpoint="PUTapi-products--id-"
               data-component="body">
        <input type="number" style="display: none"
               name="variants.*.attribute_value_ids[1]"                data-endpoint="PUTapi-products--id-"
               data-component="body">
    <br>
<p>組成此 SKU 的屬性值 ID 陣列。</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="-DELETEapi-products--id-">刪除指定的商品</h2>

<p>
</p>



<span id="example-requests-DELETEapi-products--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request DELETE \
    "http://localhost:8000/api/products/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "DELETE",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-DELETEapi-products--id-">
            <blockquote>
            <p>Example response (204, 商品刪除成功):</p>
        </blockquote>
                <pre>
<code>Empty response</code>
 </pre>
    </span>
<span id="execution-results-DELETEapi-products--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-DELETEapi-products--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-DELETEapi-products--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-DELETEapi-products--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-DELETEapi-products--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-DELETEapi-products--id-" data-method="DELETE"
      data-path="api/products/{id}"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('DELETEapi-products--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-DELETEapi-products--id-"
                    onclick="tryItOut('DELETEapi-products--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-DELETEapi-products--id-"
                    onclick="cancelTryOut('DELETEapi-products--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-DELETEapi-products--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-red">DELETE</small>
            <b><code>api/products/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="DELETEapi-products--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="DELETEapi-products--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="DELETEapi-products--id-"
               value="1"
               data-component="url">
    <br>
<p>商品的 ID。 Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="">商品變體管理</h1>

    <p>商品變體 API 端點，用於管理商品的各種變體（SKU）</p>

                                <h2 id="-GETapi-products-variants">獲取商品變體列表</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-products-variants">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/products/variants?product_id=1&amp;product_name=T%E6%81%A4&amp;sku=TSHIRT-RED-S&amp;page=1&amp;per_page=15" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/variants"
);

const params = {
    "product_id": "1",
    "product_name": "T恤",
    "sku": "TSHIRT-RED-S",
    "page": "1",
    "per_page": "15",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-products-variants">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;sku&quot;: &quot;TSHIRT-RED-S&quot;,
            &quot;price&quot;: &quot;299.99&quot;,
            &quot;product_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;product&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;經典棉質T-shirt&quot;,
                &quot;description&quot;: &quot;100% 純棉&quot;,
                &quot;category_id&quot;: 1
            },
            &quot;attribute_values&quot;: [
                {
                    &quot;id&quot;: 1,
                    &quot;value&quot;: &quot;紅色&quot;,
                    &quot;attribute_id&quot;: 1,
                    &quot;attribute&quot;: {
                        &quot;id&quot;: 1,
                        &quot;name&quot;: &quot;顏色&quot;
                    }
                },
                {
                    &quot;id&quot;: 3,
                    &quot;value&quot;: &quot;S&quot;,
                    &quot;attribute_id&quot;: 2,
                    &quot;attribute&quot;: {
                        &quot;id&quot;: 2,
                        &quot;name&quot;: &quot;尺寸&quot;
                    }
                }
            ],
            &quot;inventory&quot;: [
                {
                    &quot;id&quot;: 1,
                    &quot;quantity&quot;: 50,
                    &quot;low_stock_threshold&quot;: 10,
                    &quot;store&quot;: {
                        &quot;id&quot;: 1,
                        &quot;name&quot;: &quot;台北旗艦店&quot;
                    }
                },
                {
                    &quot;id&quot;: 2,
                    &quot;quantity&quot;: 30,
                    &quot;low_stock_threshold&quot;: 10,
                    &quot;store&quot;: {
                        &quot;id&quot;: 2,
                        &quot;name&quot;: &quot;台中中區店&quot;
                    }
                }
            ]
        },
        {
            &quot;id&quot;: 2,
            &quot;sku&quot;: &quot;TSHIRT-BLUE-M&quot;,
            &quot;price&quot;: &quot;299.99&quot;,
            &quot;product_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;product&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;經典棉質T-shirt&quot;,
                &quot;description&quot;: &quot;100% 純棉&quot;,
                &quot;category_id&quot;: 1
            },
            &quot;attribute_values&quot;: [
                {
                    &quot;id&quot;: 2,
                    &quot;value&quot;: &quot;藍色&quot;,
                    &quot;attribute_id&quot;: 1,
                    &quot;attribute&quot;: {
                        &quot;id&quot;: 1,
                        &quot;name&quot;: &quot;顏色&quot;
                    }
                },
                {
                    &quot;id&quot;: 4,
                    &quot;value&quot;: &quot;M&quot;,
                    &quot;attribute_id&quot;: 2,
                    &quot;attribute&quot;: {
                        &quot;id&quot;: 2,
                        &quot;name&quot;: &quot;尺寸&quot;
                    }
                }
            ],
            &quot;inventory&quot;: [
                {
                    &quot;id&quot;: 3,
                    &quot;quantity&quot;: 25,
                    &quot;low_stock_threshold&quot;: 10,
                    &quot;store&quot;: {
                        &quot;id&quot;: 1,
                        &quot;name&quot;: &quot;台北旗艦店&quot;
                    }
                },
                {
                    &quot;id&quot;: 4,
                    &quot;quantity&quot;: 15,
                    &quot;low_stock_threshold&quot;: 10,
                    &quot;store&quot;: {
                        &quot;id&quot;: 2,
                        &quot;name&quot;: &quot;台中中區店&quot;
                    }
                }
            ]
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/product-variants?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/product-variants?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/product-variants&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 2
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-products-variants" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-products-variants"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-products-variants"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-products-variants" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-products-variants">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-products-variants" data-method="GET"
      data-path="api/products/variants"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-products-variants', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-products-variants"
                    onclick="tryItOut('GETapi-products-variants');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-products-variants"
                    onclick="cancelTryOut('GETapi-products-variants');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-products-variants"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/products/variants</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-products-variants"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-products-variants"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>product_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="product_id"                data-endpoint="GETapi-products-variants"
               value="1"
               data-component="query">
    <br>
<p>按商品ID篩選變體. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>product_name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="product_name"                data-endpoint="GETapi-products-variants"
               value="T恤"
               data-component="query">
    <br>
<p>按商品名稱搜尋變體. Example: <code>T恤</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sku</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="sku"                data-endpoint="GETapi-products-variants"
               value="TSHIRT-RED-S"
               data-component="query">
    <br>
<p>按SKU搜尋變體. Example: <code>TSHIRT-RED-S</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-products-variants"
               value="1"
               data-component="query">
    <br>
<p>頁碼，預設為 1. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>per_page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="per_page"                data-endpoint="GETapi-products-variants"
               value="15"
               data-component="query">
    <br>
<p>每頁項目數，預設為 15. Example: <code>15</code></p>
            </div>
                </form>

                    <h2 id="-GETapi-products-variants--id-">獲取單個商品變體詳情</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-products-variants--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/products/variants/architecto" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/products/variants/architecto"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-products-variants--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
vary: Origin
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;message&quot;: &quot;Unauthenticated.&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-products-variants--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-products-variants--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-products-variants--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-products-variants--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-products-variants--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-products-variants--id-" data-method="GET"
      data-path="api/products/variants/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-products-variants--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-products-variants--id-"
                    onclick="tryItOut('GETapi-products-variants--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-products-variants--id-"
                    onclick="cancelTryOut('GETapi-products-variants--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-products-variants--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/products/variants/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-products-variants--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-products-variants--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="id"                data-endpoint="GETapi-products-variants--id-"
               value="architecto"
               data-component="url">
    <br>
<p>The ID of the variant. Example: <code>architecto</code></p>
            </div>
                    </form>

                <h1 id="">屬性值管理</h1>

    

                                <h2 id="-GETapi-attributes--attribute_id--values">獲取指定屬性的所有值</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>返回指定屬性下的所有屬性值列表</p>

<span id="example-requests-GETapi-attributes--attribute_id--values">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/attributes/1/values" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes/1/values"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-attributes--attribute_id--values">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;value&quot;: &quot;紅色&quot;,
            &quot;attribute_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
        },
        {
            &quot;id&quot;: 2,
            &quot;value&quot;: &quot;藍色&quot;,
            &quot;attribute_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
        },
        {
            &quot;id&quot;: 3,
            &quot;value&quot;: &quot;綠色&quot;,
            &quot;attribute_id&quot;: 1,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/attributes/1/values?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/attributes/1/values?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/attributes/1/values&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 3,
        &quot;total&quot;: 3
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-attributes--attribute_id--values" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-attributes--attribute_id--values"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-attributes--attribute_id--values"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-attributes--attribute_id--values" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-attributes--attribute_id--values">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-attributes--attribute_id--values" data-method="GET"
      data-path="api/attributes/{attribute_id}/values"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-attributes--attribute_id--values', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-attributes--attribute_id--values"
                    onclick="tryItOut('GETapi-attributes--attribute_id--values');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-attributes--attribute_id--values"
                    onclick="cancelTryOut('GETapi-attributes--attribute_id--values');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-attributes--attribute_id--values"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/attributes/{attribute_id}/values</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-attributes--attribute_id--values"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-attributes--attribute_id--values"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute_id"                data-endpoint="GETapi-attributes--attribute_id--values"
               value="1"
               data-component="url">
    <br>
<p>The ID of the attribute. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute"                data-endpoint="GETapi-attributes--attribute_id--values"
               value="1"
               data-component="url">
    <br>
<p>屬性 ID Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="-POSTapi-attributes--attribute_id--values">為指定屬性創建新值</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>在指定屬性下創建一個新的屬性值
屬性值在同一屬性下必須唯一</p>

<span id="example-requests-POSTapi-attributes--attribute_id--values">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/attributes/1/values" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"value\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/attributes/1/values"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "value": "architecto"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-attributes--attribute_id--values">
            <blockquote>
            <p>Example response (201):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">App\Http\Resources\Api\V1\AttributeValueResource</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-attributes--attribute_id--values" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-attributes--attribute_id--values"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-attributes--attribute_id--values"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-attributes--attribute_id--values" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-attributes--attribute_id--values">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-attributes--attribute_id--values" data-method="POST"
      data-path="api/attributes/{attribute_id}/values"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-attributes--attribute_id--values', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-attributes--attribute_id--values"
                    onclick="tryItOut('POSTapi-attributes--attribute_id--values');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-attributes--attribute_id--values"
                    onclick="cancelTryOut('POSTapi-attributes--attribute_id--values');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-attributes--attribute_id--values"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/attributes/{attribute_id}/values</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-attributes--attribute_id--values"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-attributes--attribute_id--values"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute_id"                data-endpoint="POSTapi-attributes--attribute_id--values"
               value="1"
               data-component="url">
    <br>
<p>The ID of the attribute. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>attribute</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="attribute"                data-endpoint="POSTapi-attributes--attribute_id--values"
               value="1"
               data-component="url">
    <br>
<p>屬性 ID Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>value</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="value"                data-endpoint="POSTapi-attributes--attribute_id--values"
               value="architecto"
               data-component="body">
    <br>
<p>屬性值（在同一屬性下必須唯一）。例如：紅色 Example: <code>architecto</code></p>
        </div>
        </form>

                    <h2 id="-GETapi-values--id-">獲取指定屬性值</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>返回指定的屬性值詳細資訊</p>

<span id="example-requests-GETapi-values--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/values/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/values/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-values--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">App\Http\Resources\Api\V1\AttributeValueResource</code>
 </pre>
    </span>
<span id="execution-results-GETapi-values--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-values--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-values--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-values--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-values--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-values--id-" data-method="GET"
      data-path="api/values/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-values--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-values--id-"
                    onclick="tryItOut('GETapi-values--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-values--id-"
                    onclick="cancelTryOut('GETapi-values--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-values--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/values/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-values--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-values--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-values--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the value. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>value</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="value"                data-endpoint="GETapi-values--id-"
               value="1"
               data-component="url">
    <br>
<p>屬性值 ID Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="-DELETEapi-values--id-">刪除指定屬性值</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>刪除指定的屬性值
注意：如果有商品變體正在使用此屬性值，刪除操作可能會失敗</p>

<span id="example-requests-DELETEapi-values--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request DELETE \
    "http://localhost:8000/api/values/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/values/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "DELETE",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-DELETEapi-values--id-">
            <blockquote>
            <p>Example response (204):</p>
        </blockquote>
                <pre>
<code>Empty response</code>
 </pre>
    </span>
<span id="execution-results-DELETEapi-values--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-DELETEapi-values--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-DELETEapi-values--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-DELETEapi-values--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-DELETEapi-values--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-DELETEapi-values--id-" data-method="DELETE"
      data-path="api/values/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('DELETEapi-values--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-DELETEapi-values--id-"
                    onclick="tryItOut('DELETEapi-values--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-DELETEapi-values--id-"
                    onclick="cancelTryOut('DELETEapi-values--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-DELETEapi-values--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-red">DELETE</small>
            <b><code>api/values/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="DELETEapi-values--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="DELETEapi-values--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="DELETEapi-values--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the value. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>value</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="value"                data-endpoint="DELETEapi-values--id-"
               value="1"
               data-component="url">
    <br>
<p>屬性值 ID Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="">庫存管理</h1>

    <p>庫存管理 API 端點，用於管理商品庫存</p>

                                <h2 id="-GETapi-inventory">獲取庫存列表</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-inventory">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/inventory?store_id=1&amp;low_stock=1&amp;out_of_stock=&amp;product_name=T%E6%81%A4&amp;paginate=1&amp;per_page=25" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory"
);

const params = {
    "store_id": "1",
    "low_stock": "1",
    "out_of_stock": "0",
    "product_name": "T恤",
    "paginate": "1",
    "per_page": "25",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-inventory">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;product_variant_id&quot;: 1,
            &quot;store_id&quot;: 1,
            &quot;quantity&quot;: 50,
            &quot;low_stock_threshold&quot;: 10,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-15T14:30:00.000000Z&quot;,
            &quot;product_variant&quot;: {
                &quot;id&quot;: 1,
                &quot;sku&quot;: &quot;TSHIRT-RED-S&quot;,
                &quot;price&quot;: &quot;299.99&quot;,
                &quot;product&quot;: {
                    &quot;id&quot;: 1,
                    &quot;name&quot;: &quot;經典棉質T-shirt&quot;,
                    &quot;description&quot;: &quot;100% 純棉&quot;
                },
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;value&quot;: &quot;紅色&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    },
                    {
                        &quot;id&quot;: 3,
                        &quot;value&quot;: &quot;S&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 2,
                            &quot;name&quot;: &quot;尺寸&quot;
                        }
                    }
                ]
            },
            &quot;store&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;台北旗艦店&quot;,
                &quot;address&quot;: &quot;台北市信義區信義路四段101號&quot;
            }
        },
        {
            &quot;id&quot;: 2,
            &quot;product_variant_id&quot;: 2,
            &quot;store_id&quot;: 1,
            &quot;quantity&quot;: 3,
            &quot;low_stock_threshold&quot;: 5,
            &quot;created_at&quot;: &quot;2024-01-01T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-20T09:15:00.000000Z&quot;,
            &quot;product_variant&quot;: {
                &quot;id&quot;: 2,
                &quot;sku&quot;: &quot;TSHIRT-BLUE-M&quot;,
                &quot;price&quot;: &quot;299.99&quot;,
                &quot;product&quot;: {
                    &quot;id&quot;: 1,
                    &quot;name&quot;: &quot;經典棉質T-shirt&quot;,
                    &quot;description&quot;: &quot;100% 純棉&quot;
                },
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;value&quot;: &quot;藍色&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    },
                    {
                        &quot;id&quot;: 4,
                        &quot;value&quot;: &quot;M&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 2,
                            &quot;name&quot;: &quot;尺寸&quot;
                        }
                    }
                ]
            },
            &quot;store&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;台北旗艦店&quot;,
                &quot;address&quot;: &quot;台北市信義區信義路四段101號&quot;
            }
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/inventory?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/inventory?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/inventory&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 2
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-inventory" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-inventory"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-inventory"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-inventory" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-inventory">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-inventory" data-method="GET"
      data-path="api/inventory"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-inventory', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-inventory"
                    onclick="tryItOut('GETapi-inventory');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-inventory"
                    onclick="cancelTryOut('GETapi-inventory');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-inventory"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/inventory</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-inventory"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-inventory"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="store_id"                data-endpoint="GETapi-inventory"
               value="1"
               data-component="query">
    <br>
<p>門市ID，用於篩選特定門市的庫存. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>low_stock</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
                <label data-endpoint="GETapi-inventory" style="display: none">
            <input type="radio" name="low_stock"
                   value="1"
                   data-endpoint="GETapi-inventory"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-inventory" style="display: none">
            <input type="radio" name="low_stock"
                   value="0"
                   data-endpoint="GETapi-inventory"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>是否只顯示低庫存商品. Example: <code>true</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>out_of_stock</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
                <label data-endpoint="GETapi-inventory" style="display: none">
            <input type="radio" name="out_of_stock"
                   value="1"
                   data-endpoint="GETapi-inventory"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-inventory" style="display: none">
            <input type="radio" name="out_of_stock"
                   value="0"
                   data-endpoint="GETapi-inventory"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>是否只顯示無庫存商品. Example: <code>false</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>product_name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="product_name"                data-endpoint="GETapi-inventory"
               value="T恤"
               data-component="query">
    <br>
<p>按商品名稱搜尋. Example: <code>T恤</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>paginate</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
                <label data-endpoint="GETapi-inventory" style="display: none">
            <input type="radio" name="paginate"
                   value="1"
                   data-endpoint="GETapi-inventory"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-inventory" style="display: none">
            <input type="radio" name="paginate"
                   value="0"
                   data-endpoint="GETapi-inventory"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>是否分頁. Example: <code>true</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>per_page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="per_page"                data-endpoint="GETapi-inventory"
               value="25"
               data-component="query">
    <br>
<p>每頁顯示數量，預設15. Example: <code>25</code></p>
            </div>
                </form>

                    <h2 id="-GETapi-inventory--id-">獲取單條庫存記錄詳情</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-inventory--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/inventory/architecto" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/architecto"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-inventory--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
vary: Origin
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;message&quot;: &quot;Unauthenticated.&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-inventory--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-inventory--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-inventory--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-inventory--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-inventory--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-inventory--id-" data-method="GET"
      data-path="api/inventory/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-inventory--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-inventory--id-"
                    onclick="tryItOut('GETapi-inventory--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-inventory--id-"
                    onclick="cancelTryOut('GETapi-inventory--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-inventory--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/inventory/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-inventory--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-inventory--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="id"                data-endpoint="GETapi-inventory--id-"
               value="architecto"
               data-component="url">
    <br>
<p>The ID of the inventory. Example: <code>architecto</code></p>
            </div>
                    </form>

                    <h2 id="-POSTapi-inventory-adjust">調整庫存</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-inventory-adjust">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/inventory/adjust" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"product_variant_id\": 1,
    \"store_id\": 1,
    \"action\": \"add\",
    \"quantity\": 10,
    \"notes\": \"週末促銷活動增加庫存\",
    \"metadata\": {
        \"reason\": \"restock\"
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/adjust"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "product_variant_id": 1,
    "store_id": 1,
    "action": "add",
    "quantity": 10,
    "notes": "週末促銷活動增加庫存",
    "metadata": {
        "reason": "restock"
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-inventory-adjust">
</span>
<span id="execution-results-POSTapi-inventory-adjust" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-inventory-adjust"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-inventory-adjust"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-inventory-adjust" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-inventory-adjust">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-inventory-adjust" data-method="POST"
      data-path="api/inventory/adjust"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-inventory-adjust', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-inventory-adjust"
                    onclick="tryItOut('POSTapi-inventory-adjust');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-inventory-adjust"
                    onclick="cancelTryOut('POSTapi-inventory-adjust');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-inventory-adjust"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/inventory/adjust</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-inventory-adjust"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-inventory-adjust"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>product_variant_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="product_variant_id"                data-endpoint="POSTapi-inventory-adjust"
               value="1"
               data-component="body">
    <br>
<p>商品變體ID. Example: <code>1</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="store_id"                data-endpoint="POSTapi-inventory-adjust"
               value="1"
               data-component="body">
    <br>
<p>門市ID. Example: <code>1</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>action</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="action"                data-endpoint="POSTapi-inventory-adjust"
               value="add"
               data-component="body">
    <br>
<p>操作類型 (add: 添加, reduce: 減少, set: 設定). Example: <code>add</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>quantity</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="quantity"                data-endpoint="POSTapi-inventory-adjust"
               value="10"
               data-component="body">
    <br>
<p>數量. Example: <code>10</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="notes"                data-endpoint="POSTapi-inventory-adjust"
               value="週末促銷活動增加庫存"
               data-component="body">
    <br>
<p>備註. Example: <code>週末促銷活動增加庫存</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>metadata</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="metadata"                data-endpoint="POSTapi-inventory-adjust"
               value=""
               data-component="body">
    <br>
<p>額外的元數據（可選）.</p>
        </div>
        </form>

                    <h2 id="-GETapi-inventory--id--history">獲取庫存交易歷史</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-inventory--id--history">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/inventory/1/history?start_date=2023-01-01&amp;end_date=2023-12-31&amp;type=addition&amp;per_page=20" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/1/history"
);

const params = {
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "type": "addition",
    "per_page": "20",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-inventory--id--history">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
vary: Origin
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;message&quot;: &quot;Unauthenticated.&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-inventory--id--history" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-inventory--id--history"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-inventory--id--history"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-inventory--id--history" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-inventory--id--history">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-inventory--id--history" data-method="GET"
      data-path="api/inventory/{id}/history"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-inventory--id--history', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-inventory--id--history"
                    onclick="tryItOut('GETapi-inventory--id--history');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-inventory--id--history"
                    onclick="cancelTryOut('GETapi-inventory--id--history');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-inventory--id--history"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/inventory/{id}/history</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-inventory--id--history"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-inventory--id--history"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-inventory--id--history"
               value="1"
               data-component="url">
    <br>
<p>庫存ID. Example: <code>1</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>start_date</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="start_date"                data-endpoint="GETapi-inventory--id--history"
               value="2023-01-01"
               data-component="query">
    <br>
<p>date 起始日期. Example: <code>2023-01-01</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>end_date</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="end_date"                data-endpoint="GETapi-inventory--id--history"
               value="2023-12-31"
               data-component="query">
    <br>
<p>date 結束日期. Example: <code>2023-12-31</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>type</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="type"                data-endpoint="GETapi-inventory--id--history"
               value="addition"
               data-component="query">
    <br>
<p>交易類型. Example: <code>addition</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>per_page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="per_page"                data-endpoint="GETapi-inventory--id--history"
               value="20"
               data-component="query">
    <br>
<p>每頁顯示數量，預設15. Example: <code>20</code></p>
            </div>
                </form>

                    <h2 id="-POSTapi-inventory-batch-check">批量獲取多個商品變體的庫存情況</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-inventory-batch-check">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/inventory/batch-check" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"product_variant_ids\": [
        1,
        2,
        3
    ],
    \"store_id\": 1
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/batch-check"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "product_variant_ids": [
        1,
        2,
        3
    ],
    "store_id": 1
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-inventory-batch-check">
</span>
<span id="execution-results-POSTapi-inventory-batch-check" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-inventory-batch-check"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-inventory-batch-check"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-inventory-batch-check" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-inventory-batch-check">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-inventory-batch-check" data-method="POST"
      data-path="api/inventory/batch-check"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-inventory-batch-check', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-inventory-batch-check"
                    onclick="tryItOut('POSTapi-inventory-batch-check');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-inventory-batch-check"
                    onclick="cancelTryOut('POSTapi-inventory-batch-check');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-inventory-batch-check"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/inventory/batch-check</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-inventory-batch-check"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-inventory-batch-check"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>product_variant_ids</code></b>&nbsp;&nbsp;
<small>string[]</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="product_variant_ids[0]"                data-endpoint="POSTapi-inventory-batch-check"
               data-component="body">
        <input type="text" style="display: none"
               name="product_variant_ids[1]"                data-endpoint="POSTapi-inventory-batch-check"
               data-component="body">
    <br>
<p>要查詢的商品變體ID數組.</p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="store_id"                data-endpoint="POSTapi-inventory-batch-check"
               value="1"
               data-component="body">
    <br>
<p>門市ID，如果提供則只返回該門市的庫存. Example: <code>1</code></p>
        </div>
        </form>

                <h1 id="">庫存轉移</h1>

    <p>庫存轉移 API 端點，用於在不同門市之間轉移庫存</p>

                                <h2 id="-GETapi-inventory-transfers">獲取庫存轉移記錄列表</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-inventory-transfers">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/inventory/transfers?from_store_id=1&amp;to_store_id=2&amp;status=completed&amp;start_date=2023-01-01&amp;end_date=2023-12-31&amp;product_name=T%E6%81%A4&amp;per_page=20" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/transfers"
);

const params = {
    "from_store_id": "1",
    "to_store_id": "2",
    "status": "completed",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "product_name": "T恤",
    "per_page": "20",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-inventory-transfers">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;from_store_id&quot;: 1,
            &quot;to_store_id&quot;: 2,
            &quot;user_id&quot;: 1,
            &quot;product_variant_id&quot;: 1,
            &quot;quantity&quot;: 10,
            &quot;status&quot;: &quot;completed&quot;,
            &quot;notes&quot;: &quot;調配門市庫存&quot;,
            &quot;created_at&quot;: &quot;2024-01-15T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-15T10:00:00.000000Z&quot;,
            &quot;from_store&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;台北旗艦店&quot;,
                &quot;address&quot;: &quot;台北市信義區信義路四段101號&quot;
            },
            &quot;to_store&quot;: {
                &quot;id&quot;: 2,
                &quot;name&quot;: &quot;台中中區店&quot;,
                &quot;address&quot;: &quot;台中市中區中山路123號&quot;
            },
            &quot;user&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;管理員&quot;,
                &quot;username&quot;: &quot;admin&quot;
            },
            &quot;product_variant&quot;: {
                &quot;id&quot;: 1,
                &quot;sku&quot;: &quot;TSHIRT-RED-S&quot;,
                &quot;price&quot;: &quot;299.99&quot;,
                &quot;product&quot;: {
                    &quot;id&quot;: 1,
                    &quot;name&quot;: &quot;經典棉質T-shirt&quot;,
                    &quot;description&quot;: &quot;100% 純棉&quot;
                },
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 1,
                        &quot;value&quot;: &quot;紅色&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    },
                    {
                        &quot;id&quot;: 3,
                        &quot;value&quot;: &quot;S&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 2,
                            &quot;name&quot;: &quot;尺寸&quot;
                        }
                    }
                ]
            }
        },
        {
            &quot;id&quot;: 2,
            &quot;from_store_id&quot;: 2,
            &quot;to_store_id&quot;: 1,
            &quot;user_id&quot;: 1,
            &quot;product_variant_id&quot;: 2,
            &quot;quantity&quot;: 5,
            &quot;status&quot;: &quot;in_transit&quot;,
            &quot;notes&quot;: &quot;回調庫存&quot;,
            &quot;created_at&quot;: &quot;2024-01-20T14:30:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2024-01-20T14:30:00.000000Z&quot;,
            &quot;from_store&quot;: {
                &quot;id&quot;: 2,
                &quot;name&quot;: &quot;台中中區店&quot;,
                &quot;address&quot;: &quot;台中市中區中山路123號&quot;
            },
            &quot;to_store&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;台北旗艦店&quot;,
                &quot;address&quot;: &quot;台北市信義區信義路四段101號&quot;
            },
            &quot;user&quot;: {
                &quot;id&quot;: 1,
                &quot;name&quot;: &quot;管理員&quot;,
                &quot;username&quot;: &quot;admin&quot;
            },
            &quot;product_variant&quot;: {
                &quot;id&quot;: 2,
                &quot;sku&quot;: &quot;TSHIRT-BLUE-M&quot;,
                &quot;price&quot;: &quot;299.99&quot;,
                &quot;product&quot;: {
                    &quot;id&quot;: 1,
                    &quot;name&quot;: &quot;經典棉質T-shirt&quot;,
                    &quot;description&quot;: &quot;100% 純棉&quot;
                },
                &quot;attribute_values&quot;: [
                    {
                        &quot;id&quot;: 2,
                        &quot;value&quot;: &quot;藍色&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 1,
                            &quot;name&quot;: &quot;顏色&quot;
                        }
                    },
                    {
                        &quot;id&quot;: 4,
                        &quot;value&quot;: &quot;M&quot;,
                        &quot;attribute&quot;: {
                            &quot;id&quot;: 2,
                            &quot;name&quot;: &quot;尺寸&quot;
                        }
                    }
                ]
            }
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/inventory-transfers?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/inventory-transfers?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/inventory-transfers&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 2,
        &quot;total&quot;: 2
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-inventory-transfers" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-inventory-transfers"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-inventory-transfers"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-inventory-transfers" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-inventory-transfers">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-inventory-transfers" data-method="GET"
      data-path="api/inventory/transfers"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-inventory-transfers', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-inventory-transfers"
                    onclick="tryItOut('GETapi-inventory-transfers');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-inventory-transfers"
                    onclick="cancelTryOut('GETapi-inventory-transfers');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-inventory-transfers"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/inventory/transfers</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-inventory-transfers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-inventory-transfers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>from_store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="from_store_id"                data-endpoint="GETapi-inventory-transfers"
               value="1"
               data-component="query">
    <br>
<p>來源門市ID. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>to_store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="to_store_id"                data-endpoint="GETapi-inventory-transfers"
               value="2"
               data-component="query">
    <br>
<p>目標門市ID. Example: <code>2</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="GETapi-inventory-transfers"
               value="completed"
               data-component="query">
    <br>
<p>轉移狀態. Example: <code>completed</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>start_date</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="start_date"                data-endpoint="GETapi-inventory-transfers"
               value="2023-01-01"
               data-component="query">
    <br>
<p>date 起始日期. Example: <code>2023-01-01</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>end_date</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="end_date"                data-endpoint="GETapi-inventory-transfers"
               value="2023-12-31"
               data-component="query">
    <br>
<p>date 結束日期. Example: <code>2023-12-31</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>product_name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="product_name"                data-endpoint="GETapi-inventory-transfers"
               value="T恤"
               data-component="query">
    <br>
<p>按商品名稱搜尋. Example: <code>T恤</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>per_page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="number" style="display: none"
               step="any"               name="per_page"                data-endpoint="GETapi-inventory-transfers"
               value="20"
               data-component="query">
    <br>
<p>每頁顯示數量，預設15. Example: <code>20</code></p>
            </div>
                </form>

                    <h2 id="-GETapi-inventory-transfers--id-">獲取單筆庫存轉移記錄</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-inventory-transfers--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/inventory/transfers/architecto" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/transfers/architecto"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-inventory-transfers--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
vary: Origin
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;message&quot;: &quot;Unauthenticated.&quot;
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-inventory-transfers--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-inventory-transfers--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-inventory-transfers--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-inventory-transfers--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-inventory-transfers--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-inventory-transfers--id-" data-method="GET"
      data-path="api/inventory/transfers/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-inventory-transfers--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-inventory-transfers--id-"
                    onclick="tryItOut('GETapi-inventory-transfers--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-inventory-transfers--id-"
                    onclick="cancelTryOut('GETapi-inventory-transfers--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-inventory-transfers--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/inventory/transfers/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-inventory-transfers--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-inventory-transfers--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="id"                data-endpoint="GETapi-inventory-transfers--id-"
               value="architecto"
               data-component="url">
    <br>
<p>The ID of the transfer. Example: <code>architecto</code></p>
            </div>
                    </form>

                    <h2 id="-POSTapi-inventory-transfers">創建庫存轉移記錄並執行轉移</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-inventory-transfers">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/inventory/transfers" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"from_store_id\": 1,
    \"to_store_id\": 2,
    \"product_variant_id\": 1,
    \"quantity\": 5,
    \"notes\": \"調配門市庫存\",
    \"status\": \"completed\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/transfers"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "from_store_id": 1,
    "to_store_id": 2,
    "product_variant_id": 1,
    "quantity": 5,
    "notes": "調配門市庫存",
    "status": "completed"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-inventory-transfers">
</span>
<span id="execution-results-POSTapi-inventory-transfers" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-inventory-transfers"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-inventory-transfers"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-inventory-transfers" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-inventory-transfers">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-inventory-transfers" data-method="POST"
      data-path="api/inventory/transfers"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-inventory-transfers', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-inventory-transfers"
                    onclick="tryItOut('POSTapi-inventory-transfers');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-inventory-transfers"
                    onclick="cancelTryOut('POSTapi-inventory-transfers');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-inventory-transfers"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/inventory/transfers</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-inventory-transfers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-inventory-transfers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>from_store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="from_store_id"                data-endpoint="POSTapi-inventory-transfers"
               value="1"
               data-component="body">
    <br>
<p>來源門市ID. Example: <code>1</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>to_store_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="to_store_id"                data-endpoint="POSTapi-inventory-transfers"
               value="2"
               data-component="body">
    <br>
<p>目標門市ID. Example: <code>2</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>product_variant_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="product_variant_id"                data-endpoint="POSTapi-inventory-transfers"
               value="1"
               data-component="body">
    <br>
<p>商品變體ID. Example: <code>1</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>quantity</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="quantity"                data-endpoint="POSTapi-inventory-transfers"
               value="5"
               data-component="body">
    <br>
<p>轉移數量. Example: <code>5</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="notes"                data-endpoint="POSTapi-inventory-transfers"
               value="調配門市庫存"
               data-component="body">
    <br>
<p>備註. Example: <code>調配門市庫存</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="POSTapi-inventory-transfers"
               value="completed"
               data-component="body">
    <br>
<p>狀態，預設為 completed. Example: <code>completed</code></p>
        </div>
        </form>

                    <h2 id="-PATCHapi-inventory-transfers--id--status">更新庫存轉移記錄狀態</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-inventory-transfers--id--status">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/inventory/transfers/1/status" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"status\": \"completed\",
    \"notes\": \"已確認收到貨品\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/transfers/1/status"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "status": "completed",
    "notes": "已確認收到貨品"
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-inventory-transfers--id--status">
</span>
<span id="execution-results-PATCHapi-inventory-transfers--id--status" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-inventory-transfers--id--status"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-inventory-transfers--id--status"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-inventory-transfers--id--status" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-inventory-transfers--id--status">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-inventory-transfers--id--status" data-method="PATCH"
      data-path="api/inventory/transfers/{id}/status"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-inventory-transfers--id--status', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-inventory-transfers--id--status"
                    onclick="tryItOut('PATCHapi-inventory-transfers--id--status');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-inventory-transfers--id--status"
                    onclick="cancelTryOut('PATCHapi-inventory-transfers--id--status');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-inventory-transfers--id--status"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/inventory/transfers/{id}/status</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-inventory-transfers--id--status"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-inventory-transfers--id--status"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-inventory-transfers--id--status"
               value="1"
               data-component="url">
    <br>
<p>轉移記錄ID. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="PATCHapi-inventory-transfers--id--status"
               value="completed"
               data-component="body">
    <br>
<p>新狀態. Example: <code>completed</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="notes"                data-endpoint="PATCHapi-inventory-transfers--id--status"
               value="已確認收到貨品"
               data-component="body">
    <br>
<p>備註. Example: <code>已確認收到貨品</code></p>
        </div>
        </form>

                    <h2 id="-PATCHapi-inventory-transfers--id--cancel">取消庫存轉移</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-inventory-transfers--id--cancel">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/inventory/transfers/1/cancel" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"reason\": \"商品損壞，不需要轉移\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/inventory/transfers/1/cancel"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "reason": "商品損壞，不需要轉移"
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-inventory-transfers--id--cancel">
</span>
<span id="execution-results-PATCHapi-inventory-transfers--id--cancel" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-inventory-transfers--id--cancel"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-inventory-transfers--id--cancel"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-inventory-transfers--id--cancel" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-inventory-transfers--id--cancel">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-inventory-transfers--id--cancel" data-method="PATCH"
      data-path="api/inventory/transfers/{id}/cancel"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-inventory-transfers--id--cancel', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-inventory-transfers--id--cancel"
                    onclick="tryItOut('PATCHapi-inventory-transfers--id--cancel');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-inventory-transfers--id--cancel"
                    onclick="cancelTryOut('PATCHapi-inventory-transfers--id--cancel');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-inventory-transfers--id--cancel"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/inventory/transfers/{id}/cancel</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-inventory-transfers--id--cancel"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-inventory-transfers--id--cancel"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-inventory-transfers--id--cancel"
               value="1"
               data-component="url">
    <br>
<p>轉移記錄ID. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>reason</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="reason"                data-endpoint="PATCHapi-inventory-transfers--id--cancel"
               value="商品損壞，不需要轉移"
               data-component="body">
    <br>
<p>取消原因. Example: <code>商品損壞，不需要轉移</code></p>
        </div>
        </form>

                <h1 id="">用戶管理</h1>

    

                                <h2 id="-GETapi-users">顯示用戶列表</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>支援對 name 和 username 欄位進行部分匹配篩選。</p>

<span id="example-requests-GETapi-users">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/users?filter%5Bname%5D=admin&amp;filter%5Busername%5D=superadmin&amp;filter%5Bsearch%5D=admin" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users"
);

const params = {
    "filter[name]": "admin",
    "filter[username]": "superadmin",
    "filter[search]": "admin",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-users">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;id&quot;: 1,
            &quot;name&quot;: &quot;Super Admin&quot;,
            &quot;username&quot;: &quot;superadmin&quot;,
            &quot;role&quot;: &quot;admin&quot;,
            &quot;role_display&quot;: &quot;管理員&quot;,
            &quot;is_admin&quot;: true,
            &quot;created_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;,
            &quot;updated_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://localhost/api/users?page=1&quot;,
        &quot;last&quot;: &quot;http://localhost/api/users?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;from&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;path&quot;: &quot;http://localhost/api/users&quot;,
        &quot;per_page&quot;: 15,
        &quot;to&quot;: 1,
        &quot;total&quot;: 1
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-users" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-users"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-users"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-users" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-users">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-users" data-method="GET"
      data-path="api/users"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-users', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-users"
                    onclick="tryItOut('GETapi-users');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-users"
                    onclick="cancelTryOut('GETapi-users');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-users"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/users</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>filter[name]</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="filter[name]"                data-endpoint="GETapi-users"
               value="admin"
               data-component="query">
    <br>
<p>對用戶名稱進行模糊搜尋。 Example: <code>admin</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>filter[username]</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="filter[username]"                data-endpoint="GETapi-users"
               value="superadmin"
               data-component="query">
    <br>
<p>對用戶帳號進行模糊搜尋。 Example: <code>superadmin</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>filter[search]</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="filter[search]"                data-endpoint="GETapi-users"
               value="admin"
               data-component="query">
    <br>
<p>對名稱或帳號進行全域模糊搜尋。 Example: <code>admin</code></p>
            </div>
                </form>

                    <h2 id="-POSTapi-users">建立新用戶</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>接收用戶創建請求，進行驗證後建立新用戶帳號。
自動將密碼進行 bcrypt 雜湊處理確保安全性。
權限檢查：需要通過 UserPolicy::create() 方法（僅管理員可執行）</p>

<span id="example-requests-POSTapi-users">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/users" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"architecto\",
    \"username\": \"architecto\",
    \"password\": \"|]|{+-\",
    \"role\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "architecto",
    "username": "architecto",
    "password": "|]|{+-",
    "role": "architecto"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-users">
            <blockquote>
            <p>Example response (201):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;Super Admin&quot;,
        &quot;username&quot;: &quot;superadmin&quot;,
        &quot;role&quot;: &quot;admin&quot;,
        &quot;role_display&quot;: &quot;管理員&quot;,
        &quot;is_admin&quot;: true,
        &quot;created_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-users" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-users"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-users"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-users" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-users">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-users" data-method="POST"
      data-path="api/users"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-users', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-users"
                    onclick="tryItOut('POSTapi-users');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-users"
                    onclick="cancelTryOut('POSTapi-users');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-users"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/users</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="POSTapi-users"
               value="architecto"
               data-component="body">
    <br>
<p>用戶姓名。例如：張三 Example: <code>architecto</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="username"                data-endpoint="POSTapi-users"
               value="architecto"
               data-component="body">
    <br>
<p>用戶名（唯一）。例如：zhangsan Example: <code>architecto</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="POSTapi-users"
               value="|]|{+-"
               data-component="body">
    <br>
<p>用戶密碼（至少8個字元）。例如：password123 Example: <code>|]|{+-</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>role</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="role"                data-endpoint="POSTapi-users"
               value="architecto"
               data-component="body">
    <br>
<p>用戶角色，必須是 admin 或 viewer。例如：admin Example: <code>architecto</code></p>
        </div>
        </form>

                    <h2 id="-GETapi-users--id-">顯示指定用戶</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>根據用戶 ID 返回特定用戶的完整資料。
權限檢查：需要通過 UserPolicy::view() 方法（僅管理員可存取）</p>

<span id="example-requests-GETapi-users--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/users/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-users--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;Super Admin&quot;,
        &quot;username&quot;: &quot;superadmin&quot;,
        &quot;role&quot;: &quot;admin&quot;,
        &quot;role_display&quot;: &quot;管理員&quot;,
        &quot;is_admin&quot;: true,
        &quot;created_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-users--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-users--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-users--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-users--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-users--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-users--id-" data-method="GET"
      data-path="api/users/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-users--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-users--id-"
                    onclick="tryItOut('GETapi-users--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-users--id-"
                    onclick="cancelTryOut('GETapi-users--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-users--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/users/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-users--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user"                data-endpoint="GETapi-users--id-"
               value="1"
               data-component="url">
    <br>
<p>用戶的 ID。 Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="-PUTapi-users--id-">更新指定用戶</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>接收用戶更新請求，進行驗證後更新用戶資料。
支援部分更新（只更新提供的欄位）。
如果請求中包含密碼，會自動進行 bcrypt 雜湊處理。
權限檢查：需要通過 UserPolicy::update() 方法（僅管理員可執行）</p>

<span id="example-requests-PUTapi-users--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/users/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"name\": \"John Doe\",
    \"username\": \"johndoe\",
    \"password\": \"newpassword123\",
    \"role\": \"admin\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "name": "John Doe",
    "username": "johndoe",
    "password": "newpassword123",
    "role": "admin"
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-users--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;Super Admin&quot;,
        &quot;username&quot;: &quot;superadmin&quot;,
        &quot;role&quot;: &quot;admin&quot;,
        &quot;role_display&quot;: &quot;管理員&quot;,
        &quot;is_admin&quot;: true,
        &quot;created_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2025-06-11T10:00:00.000000Z&quot;
    }
}</code>
 </pre>
    </span>
<span id="execution-results-PUTapi-users--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-users--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-users--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-users--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-users--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-users--id-" data-method="PUT"
      data-path="api/users/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-users--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-users--id-"
                    onclick="tryItOut('PUTapi-users--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-users--id-"
                    onclick="cancelTryOut('PUTapi-users--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-users--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/users/{id}</code></b>
        </p>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/users/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PUTapi-users--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user"                data-endpoint="PUTapi-users--id-"
               value="1"
               data-component="url">
    <br>
<p>用戶的 ID。 Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="name"                data-endpoint="PUTapi-users--id-"
               value="John Doe"
               data-component="body">
    <br>
<p>用戶姓名（可選更新）. Must not be greater than 255 characters. Example: <code>John Doe</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="username"                data-endpoint="PUTapi-users--id-"
               value="johndoe"
               data-component="body">
    <br>
<p>用戶帳號（可選更新）. Must not be greater than 255 characters. Example: <code>johndoe</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="PUTapi-users--id-"
               value="newpassword123"
               data-component="body">
    <br>
<p>用戶密碼（可選更新，如不提供則保持原密碼）. Must be at least 8 characters. Example: <code>newpassword123</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>role</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="role"                data-endpoint="PUTapi-users--id-"
               value="admin"
               data-component="body">
    <br>
<p>用戶角色（可選更新）. Example: <code>admin</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>admin</code></li> <li><code>viewer</code></li></ul>
        </div>
        </form>

                    <h2 id="-DELETEapi-users--id-">刪除指定用戶</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>執行用戶刪除操作，成功後返回 204 No Content 回應。
權限檢查：需要通過 UserPolicy::delete() 方法</p>
<p>安全機制：</p>
<ul>
<li>只有管理員可以刪除用戶</li>
<li>管理員不能刪除自己的帳號（在 UserPolicy 中檢查）</li>
<li>檢視者無法執行刪除操作</li>
</ul>

<span id="example-requests-DELETEapi-users--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request DELETE \
    "http://localhost:8000/api/users/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/users/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "DELETE",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-DELETEapi-users--id-">
            <blockquote>
            <p>Example response (204):</p>
        </blockquote>
                <pre>
<code>Empty response</code>
 </pre>
    </span>
<span id="execution-results-DELETEapi-users--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-DELETEapi-users--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-DELETEapi-users--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-DELETEapi-users--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-DELETEapi-users--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-DELETEapi-users--id-" data-method="DELETE"
      data-path="api/users/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('DELETEapi-users--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-DELETEapi-users--id-"
                    onclick="tryItOut('DELETEapi-users--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-DELETEapi-users--id-"
                    onclick="cancelTryOut('DELETEapi-users--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-DELETEapi-users--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-red">DELETE</small>
            <b><code>api/users/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="DELETEapi-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="DELETEapi-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="DELETEapi-users--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user"                data-endpoint="DELETEapi-users--id-"
               value="1"
               data-component="url">
    <br>
<p>用戶的 ID。 Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="">規格庫管理</h1>

    

                                <h2 id="-PUTapi-values--id-">更新指定的屬性值</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-values--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/values/1" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"value\": \"architecto\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/values/1"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "value": "architecto"
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-values--id-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;id&quot;: 1,
        &quot;value&quot;: &quot;紅色&quot;,
        &quot;attribute_id&quot;: 1
    }
}</code>
 </pre>
    </span>
<span id="execution-results-PUTapi-values--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-values--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-values--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-values--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-values--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-values--id-" data-method="PUT"
      data-path="api/values/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-values--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-values--id-"
                    onclick="tryItOut('PUTapi-values--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-values--id-"
                    onclick="cancelTryOut('PUTapi-values--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-values--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/values/{id}</code></b>
        </p>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/values/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-values--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-values--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PUTapi-values--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the value. Example: <code>1</code></p>
            </div>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>value</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="value"                data-endpoint="PUTapi-values--id-"
               value="1"
               data-component="url">
    <br>
<p>要更新的屬性值的 ID。 Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>value</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="value"                data-endpoint="PUTapi-values--id-"
               value="architecto"
               data-component="body">
    <br>
<p>屬性值（在同一屬性下必須唯一，會排除當前值）。例如：藍色 Example: <code>architecto</code></p>
        </div>
        </form>

                <h1 id="">認證管理</h1>

    

                                <h2 id="-POSTapi-login">處理使用者登入請求</h2>

<p>
</p>



<span id="example-requests-POSTapi-login">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/login" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"username\": \"superadmin\",
    \"password\": \"password\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/login"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "username": "superadmin",
    "password": "password"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-login">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;user&quot;: {
        &quot;id&quot;: 1,
        &quot;name&quot;: &quot;Super Admin&quot;,
        &quot;username&quot;: &quot;superadmin&quot;,
        &quot;role&quot;: &quot;admin&quot;,
        &quot;role_display&quot;: &quot;管理員&quot;,
        &quot;is_admin&quot;: true,
        &quot;created_at&quot;: &quot;2024-01-01T00:00:00.000000Z&quot;,
        &quot;updated_at&quot;: &quot;2024-01-01T00:00:00.000000Z&quot;
    },
    &quot;token&quot;: &quot;1|abcdefghijklmnopqrstuvwxyz&quot;
}</code>
 </pre>
            <blockquote>
            <p>Example response (422):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;message&quot;: &quot;The given data was invalid.&quot;,
    &quot;errors&quot;: {
        &quot;username&quot;: [
            &quot;您提供的憑證不正確。&quot;
        ]
    }
}</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-login" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-login"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-login"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-login" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-login">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-login" data-method="POST"
      data-path="api/login"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-login', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-login"
                    onclick="tryItOut('POSTapi-login');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-login"
                    onclick="cancelTryOut('POSTapi-login');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-login"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/login</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-login"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-login"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="username"                data-endpoint="POSTapi-login"
               value="superadmin"
               data-component="body">
    <br>
<p>使用者名稱 Example: <code>superadmin</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="POSTapi-login"
               value="password"
               data-component="body">
    <br>
<p>密碼 Example: <code>password</code></p>
        </div>
        </form>

                    <h2 id="-POSTapi-logout">處理使用者登出請求</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-logout">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/logout" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/logout"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-logout">
            <blockquote>
            <p>Example response (204, 成功登出):</p>
        </blockquote>
                <pre>
<code>Empty response</code>
 </pre>
    </span>
<span id="execution-results-POSTapi-logout" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-logout"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-logout"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-logout" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-logout">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-logout" data-method="POST"
      data-path="api/logout"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-logout', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-logout"
                    onclick="tryItOut('POSTapi-logout');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-logout"
                    onclick="cancelTryOut('POSTapi-logout');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-logout"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/logout</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-logout"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-logout"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

            

        
    </div>
    <div class="dark-box">
                    <div class="lang-selector">
                                                        <button type="button" class="lang-button" data-language-name="bash">bash</button>
                                                        <button type="button" class="lang-button" data-language-name="javascript">javascript</button>
                            </div>
            </div>
</div>
</body>
</html>
