<?php
/**
 * post.php - renders a WordPress post at verifitech.com/{slug}
 * Content is fetched from wp.verifitech.com and cached locally.
 */

const WP_BASE   = 'https://wp.verifitech.com';
const SITE_BASE = 'https://verifitech.com';
const CACHE_DIR = __DIR__ . '/cache';
const CACHE_TTL = 900; // 15 minutes

function not_found() {
    http_response_code(404);
    // Replace with your own 404 page if you have one:
    if (is_file(__DIR__ . '/404.html')) { readfile(__DIR__ . '/404.html'); }
    else { echo '<!doctype html><title>Page not found</title><h1>Page not found</h1>'; }
    exit;
}

function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

$slug = strtolower($_GET['slug'] ?? '');
if (!preg_match('/^[a-z0-9-]{1,200}$/', $slug)) not_found();

$cacheFile = CACHE_DIR . '/' . $slug . '.json';
$post = null;

// 1. Fresh cache
if (is_file($cacheFile) && (time() - filemtime($cacheFile) < CACHE_TTL)) {
    $post = json_decode(file_get_contents($cacheFile), true);
}

// 2. Otherwise ask WordPress
if (!$post) {
    $url = WP_BASE . '/wp-json/wp/v2/posts?_embed&slug=' . urlencode($slug);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'VerifitechSite/1.0',
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body !== false && $code === 200) {
        $list = json_decode($body, true);
        if (is_array($list) && count($list) > 0) {
            $post = $list[0];
            @file_put_contents($cacheFile, json_encode($post));
        } else {
            not_found(); // WordPress answered, but no such post
        }
    } elseif (is_file($cacheFile)) {
        // WordPress is down: serve stale copy rather than an error
        $post = json_decode(file_get_contents($cacheFile), true);
    }
}

if (!$post) not_found();

// 3. Prepare fields
$title     = html_entity_decode(strip_tags($post['title']['rendered']), ENT_QUOTES, 'UTF-8');
$content   = $post['content']['rendered'];
$canonical = SITE_BASE . '/' . $post['slug'];
$desc      = $post['yoast_head_json']['description']      // Yoast, if installed
          ?? trim(strip_tags($post['excerpt']['rendered']));
$desc      = mb_substr(html_entity_decode($desc, ENT_QUOTES, 'UTF-8'), 0, 160);
$image     = $post['_embedded']['wp:featuredmedia'][0]['source_url'] ?? '';
$date      = $post['date_gmt'] ?? $post['date'];
$modified  = $post['modified_gmt'] ?? $post['modified'];
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($title) ?> | Verifitech</title>
  <meta name="description" content="<?= e($desc) ?>">
  <link rel="canonical" href="<?= e($canonical) ?>">

  <meta property="og:type" content="article">
  <meta property="og:title" content="<?= e($title) ?>">
  <meta property="og:description" content="<?= e($desc) ?>">
  <meta property="og:url" content="<?= e($canonical) ?>">
  <?php if ($image): ?><meta property="og:image" content="<?= e($image) ?>"><?php endif; ?>
  <meta name="twitter:card" content="summary_large_image">

  <script type="application/ld+json"><?= json_encode([
    '@context' => 'https://schema.org',
    '@type' => 'BlogPosting',
    'headline' => $title,
    'description' => $desc,
    'image' => $image ?: null,
    'datePublished' => $date . 'Z',
    'dateModified' => $modified . 'Z',
    'mainEntityOfPage' => $canonical,
    'publisher' => ['@type' => 'Organization', 'name' => 'Verifitech'],
  ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>

  <!-- TODO: paste your site's <head> CSS/JS links here (copy from resources/blog page) -->
  
</head>
<body>
  
<script src="../components/site-header.js"></script>
<site-header></site-header>
  
  <main class="blog-post">
    <article>
      <h1><?= e($title) ?></h1>
      <time datetime="<?= e($date) ?>"><?= e(date('F j, Y', strtotime($date))) ?></time>
      <?php if ($image): ?>
        <img src="<?= e($image) ?>" alt="<?= e($title) ?>" style="max-width:100%;height:auto">
      <?php endif; ?>
      <div class="post-content"><?= $content ?></div>
    </article>
  </main>

<script src="../components/site-footer.js"></script>
<site-footer></site-footer>

</body>
</html>
