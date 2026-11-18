<?php
/**
 * post.php - renders a WordPress post at verifitech.com/{slug}
 * Content comes from wp.verifitech.com and is cached locally.
 */

const WP_API    = 'https://wp.verifitech.com/wp-json/wp/v2';
const SITE_BASE = 'https://verifitech.com';
const CACHE_DIR = __DIR__ . '/cache';
const CACHE_TTL = 900; // 15 minutes

function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function fail($code, $msg) {
    http_response_code($code);
    if ($code === 404 && is_file(__DIR__ . '/404.html')) { readfile(__DIR__ . '/404.html'); exit; }
    echo '<!doctype html><meta charset="utf-8"><title>' . e($msg) . '</title><h1>' . e($msg) . '</h1>';
    exit;
}

/** Fetch from WordPress with file cache. Returns array (maybe empty) or null if WP is unreachable and no cache exists. */
function wp_fetch($path, $cacheKey) {
    $file = CACHE_DIR . '/' . $cacheKey . '.json';
    if (is_file($file) && (time() - filemtime($file) < CACHE_TTL)) {
        return json_decode(file_get_contents($file), true);
    }
    $ch = curl_init(WP_API . $path);
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
        $data = json_decode($body, true);
        if (is_array($data)) {
            if (count($data) > 0) @file_put_contents($file, json_encode($data));
            return $data;
        }
    }
    // WordPress down: use stale cache if we have one
    if (is_file($file)) return json_decode(file_get_contents($file), true);
    return null;
}

function category_of($post) {
    foreach (($post['_embedded']['wp:term'] ?? []) as $terms) {
        if (($terms[0]['taxonomy'] ?? '') === 'category') return $terms[0];
    }
    return ['name' => 'General', 'id' => null];
}

function image_of($post, $fallback = '') {
    return $post['_embedded']['wp:featuredmedia'][0]['source_url'] ?? $fallback;
}

// ---- Load post -------------------------------------------------------------
$slug = strtolower($_GET['slug'] ?? '');
if (!preg_match('/^[a-z0-9-]{1,200}$/', $slug)) fail(404, 'Page not found');

$list = wp_fetch('/posts?_embed=wp:featuredmedia,wp:term,author&slug=' . urlencode($slug), $slug);
if ($list === null) fail(503, 'Temporarily unavailable');
if (count($list) === 0) fail(404, 'Page not found');
$post = $list[0];

// ---- Prepare fields --------------------------------------------------------
$title     = html_entity_decode(strip_tags($post['title']['rendered']), ENT_QUOTES, 'UTF-8');
$canonical = SITE_BASE . '/' . $post['slug'];
$cat       = category_of($post);
$image     = image_of($post, SITE_BASE . '/images/og-default.jpg'); // change fallback if you like
$date      = $post['date'];
$dateGmt   = $post['date_gmt'] ?? $post['date'];
$modGmt    = $post['modified_gmt'] ?? $post['modified'];
$desc      = $post['yoast_head_json']['description']
          ?? trim(strip_tags($post['excerpt']['rendered']));
$desc      = mb_substr(html_entity_decode($desc, ENT_QUOTES, 'UTF-8'), 0, 160);

// Remove the first image from body (it is the featured image, shown above) - same as your blog page JS
$content   = preg_replace('/<img\b[^>]*>/i', '', $post['content']['rendered'], 1);
$readTime  = max(1, (int)ceil(str_word_count(strip_tags($post['content']['rendered'])) / 200));

$eu = urlencode($canonical);
$et = urlencode($title);

// ---- Related posts ---------------------------------------------------------
$related = [];
if (!empty($cat['id'])) {
    $related = wp_fetch('/posts?per_page=3&exclude=' . (int)$post['id'] . '&categories=' . (int)$cat['id']
        . '&_embed=wp:featuredmedia,wp:term', 'related-' . (int)$post['id']) ?? [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google Tag Manager -->
    <script src="/components/site-gtm.js"></script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?> - Verifitech Blog</title>
    <meta name="description" content="<?= e($desc) ?>">
    <link rel="canonical" href="<?= e($canonical) ?>">

    <meta property="og:type" content="article">
    <meta property="og:title" content="<?= e($title) ?>">
    <meta property="og:description" content="<?= e($desc) ?>">
    <meta property="og:url" content="<?= e($canonical) ?>">
    <meta property="og:image" content="<?= e($image) ?>">
    <meta name="twitter:card" content="summary_large_image">

    <script type="application/ld+json"><?= json_encode([
        '@context' => 'https://schema.org',
        '@type' => 'BlogPosting',
        'headline' => $title,
        'description' => $desc,
        'image' => $image,
        'datePublished' => $dateGmt . 'Z',
        'dateModified' => $modGmt . 'Z',
        'mainEntityOfPage' => $canonical,
        'publisher' => ['@type' => 'Organization', 'name' => 'Verifitech'],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary: #1ac2c1;
            --primary-dark: #16a8a7;
            --primary-light: #e0f7f7;
            --dark: #0f172a;
            --navy: #1e293b;
            --gray: #64748b;
            --light-gray: #f8fafc;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Inter", sans-serif; color: var(--dark); line-height: 1.6; background: var(--light-gray); }

        /* ===== NAVBAR / HEADER ===== */
        .navbar { z-index: 1050; padding: 0; transition: all .3s cubic-bezier(.4,0,.2,1); background: rgba(255,255,255,.98); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,.05); height: 80px; }
        .navbar.scrolled { box-shadow: 0 4px 30px rgba(0,0,0,.08); }
        .navbar-collapse { background: rgba(255,255,255,.98); backdrop-filter: blur(12px); border-radius: 12px; padding: 1rem; margin-top: .5rem; box-shadow: 0 20px 50px rgba(0,0,0,.15); }
        @media (min-width: 992px) { .navbar-collapse { background: transparent; backdrop-filter: none; padding: 0; margin-top: 0; box-shadow: none; } }
        .navbar-brand { font-weight: 800; font-size: 1.8rem; color: var(--dark); letter-spacing: -.5px; display: flex; flex-direction: column; line-height: 1.1; transition: color .3s; }
        .navbar-brand img { height: 80px; width: 200px; object-fit: contain; display: block; }
        .navbar-brand span { color: var(--primary); }
        .nav-link { font-weight: 600; color: var(--navy); margin: 0 .6rem; position: relative; font-size: .9rem; transition: all .3s ease; padding: 2rem .5rem !important; display: flex; align-items: center; gap: 4px; }
        .nav-link:hover { color: var(--primary); }
        .dropdown-menu { z-index: 1060; position: absolute; border: none; box-shadow: 0 20px 50px rgba(0,0,0,.15); border-radius: 12px; padding: 1rem; margin-top: .5rem; min-width: 280px; border-top: 3px solid var(--primary); transition: all .3s ease; }
        .dropdown-menu.mega-menu { min-width: 600px; padding: 1.5rem; }
        .dropdown-item { position: relative; z-index: 1061; padding: .6rem 1rem; border-radius: 8px; font-size: .9rem; font-weight: 500; color: var(--navy); transition: all .3s ease; display: flex; align-items: center; gap: 10px; }
        .dropdown-item:hover { background: var(--primary-light); color: var(--primary); transform: translateX(5px); }
        .dropdown-item i { font-size: 1.1rem; color: var(--primary); }
        .dropdown-header { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); margin-bottom: .5rem; padding: .5rem 1rem; }
        .btn-sales { background: var(--primary); color: #fff !important; border: none; padding: .6rem 1.5rem; border-radius: 6px; font-weight: 600; font-size: .9rem; transition: all .3s ease; white-space: nowrap; margin-left: 1rem; box-shadow: 0 4px 15px rgba(26,194,193,.3); }
        .btn-sales:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26,194,193,.4); }
        .btn-login { background-color: #fff !important; color: #00bfa5 !important; border: 1px solid #00bfa5 !important; box-shadow: 0 2px 8px rgba(0,191,165,.3) !important; padding: 8px 24px; border-radius: 6px; font-weight: 500; text-decoration: none; transition: all .3s ease; margin: 12px; }
        .btn-login:hover { background-color: #00bfa5 !important; color: #fff !important; box-shadow: 0 4px 12px rgba(0,191,165,.4) !important; transform: translateY(-1px); }
        .country-selector { display: flex; align-items: center; gap: 6px; padding: .5rem; border-radius: 6px; border: 1px solid #e2e8f0; font-size: .85rem; font-weight: 600; color: var(--navy); cursor: pointer; transition: all .3s ease; margin-left: 1rem; }
        .country-selector:hover { border-color: var(--primary); color: var(--primary); }
        .country-selector.dropdown-toggle::after { display: none !important; }
        .country-selector i.bi-chevron-down { font-size: .7rem; color: var(--navy); transition: transform .3s ease; }
        .country-selector:hover i.bi-chevron-down { color: var(--primary); }
        .country-selector[aria-expanded="true"] i.bi-chevron-down { transform: rotate(180deg); }
        .country-flag { font-size: 1.2rem; }

        /* ===== SINGLE POST ===== */
        .single-post-view { padding: 120px 0 60px; background: linear-gradient(135deg, #f0fdfa 0%, #fff 50%, #ccfbf1 100%); min-height: 100vh; }
        .post-category-single { display: inline-flex; align-items: center; gap: 8px; padding: .6rem 1.2rem; background: var(--primary); color: #fff; border-radius: 50px; font-size: .85rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1.5rem; }
        .post-title-single { font-size: 2.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 1.5rem; color: var(--dark); }
        .post-meta-single { display: flex; align-items: center; gap: 2rem; color: var(--gray); font-size: .95rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .featured-image-single { width: 100%; max-width: 1000px; height: 400px; object-fit: cover; border-radius: 20px; margin: 0 auto 3rem; display: block; box-shadow: 0 25px 50px rgba(0,0,0,.15); }
        .post-content-single { max-width: 800px; margin: 0 auto; font-size: 1.125rem; line-height: 1.8; color: var(--navy); }
        .post-content-single p { margin-bottom: 1.5rem; }
        .post-content-single h2 { font-size: 2rem; font-weight: 700; margin: 2.5rem 0 1rem; color: var(--dark); }
        .post-content-single h3 { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem; color: var(--dark); }
        .post-content-single img { max-width: 100%; height: auto; border-radius: 12px; margin: 2rem 0; }
        .btn-back { display: inline-flex; align-items: center; gap: 8px; background: var(--primary); color: #fff; padding: .75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 2rem; transition: all .3s; border: none; cursor: pointer; }
        .btn-back:hover { background: var(--primary-dark); transform: translateY(-2px); color: #fff; }

        /* Share section */
        .blog-actions-section { max-width: 800px; margin: 3rem auto; padding: 2rem; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,.05); }
        .blog-actions-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--dark); text-align: center; }
        .blog-actions-grid { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 1.5rem; }
        .action-btn { display: inline-flex; align-items: center; gap: 8px; padding: .75rem 1.25rem; border-radius: 50px; font-weight: 600; font-size: .9rem; cursor: pointer; transition: all .3s ease; border: 2px solid transparent; text-decoration: none; }
        .action-btn-copy { background: var(--primary-light); color: var(--primary-dark); border-color: var(--primary); }
        .action-btn-copy:hover { background: var(--primary); color: #fff; transform: translateY(-2px); }
        .action-btn-share { background: #1877f2; color: #fff; }
        .action-btn-share:hover { background: #166fe5; transform: translateY(-2px); color: #fff; }
        .action-btn-twitter { background: #000; color: #fff; }
        .action-btn-twitter:hover { background: #333; transform: translateY(-2px); color: #fff; }
        .action-btn-linkedin { background: #0a66c2; color: #fff; }
        .action-btn-linkedin:hover { background: #0842a0; transform: translateY(-2px); color: #fff; }
        .action-btn-whatsapp { background: #25d366; color: #fff; }
        .action-btn-whatsapp:hover { background: #128c7e; transform: translateY(-2px); color: #fff; }
        .copy-feedback { text-align: center; color: var(--primary); font-weight: 600; opacity: 0; transition: opacity .3s; margin-top: 1rem; }
        .copy-feedback.show { opacity: 1; }

        /* Related posts */
        .related-blogs-section { background: #fff; padding: 60px 0; margin-top: 4rem; border-top: 1px solid #e2e8f0; }
        .related-blogs-title { font-size: 2rem; font-weight: 800; text-align: center; margin-bottom: 3rem; color: var(--dark); }
        .related-blogs-title span { color: var(--primary); }
        .related-blog-card { display: block; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; transition: all .4s ease; height: 100%; text-decoration: none; color: inherit; }
        .related-blog-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,.1); border-color: var(--primary); color: inherit; }
        .related-blog-image { height: 180px; position: relative; overflow: hidden; background: linear-gradient(135deg, #e0f7f7, #dbeafe); }
        .related-blog-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
        .related-blog-card:hover .related-blog-image img { transform: scale(1.05); }
        .related-blog-content { padding: 1.25rem; }
        .related-blog-category { display: inline-block; padding: .3rem .8rem; background: var(--primary-light); color: var(--primary-dark); border-radius: 50px; font-size: .75rem; font-weight: 600; text-transform: uppercase; margin-bottom: .75rem; }
        .related-blog-content h4 { font-size: 1.1rem; font-weight: 700; line-height: 1.4; color: var(--dark); margin-bottom: .5rem; }
        .related-blog-date { color: var(--gray); font-size: .85rem; display: flex; align-items: center; gap: 6px; }

        @media (max-width: 768px) {
            .post-title-single { font-size: 2rem; }
            .featured-image-single { height: 250px; }
            .blog-actions-grid { flex-direction: column; align-items: stretch; }
            .action-btn { justify-content: center; }
        }

        /* ===== FOOTER ===== */
        .footer { background: #f0fdfa; color: var(--dark); padding: 80px 0 40px; }
        .footer-brand { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; display: block; color: var(--dark); text-decoration: none; }
        .footer-brand span { color: var(--primary); }
        .footer-desc { color: var(--gray); margin-bottom: 2rem; max-width: 300px; line-height: 1.8; }
        .footer h5 { font-weight: 700; margin-bottom: 1.5rem; color: var(--dark); font-size: 1.1rem; }
        .footer-links { list-style: none; padding: 0; }
        .footer-links li { margin-bottom: 1rem; }
        .footer-links a { color: var(--gray); text-decoration: none; transition: all .3s; display: inline-block; }
        .footer-links a:hover { color: var(--primary) !important; transform: translateX(5px); }
        .footer-bottom { margin-top: 60px; padding-top: 30px; border-top: 1px solid #cbd5e1; text-align: center; color: var(--gray); font-size: .9rem; }
        .social-icons { display: flex; gap: 1rem; margin-top: 2rem; }
        .social-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(15,23,42,.1); display: flex; align-items: center; justify-content: center; color: var(--dark); transition: all .3s; text-decoration: none; }
        .social-icon:hover { background: var(--primary) !important; color: #fff !important; transform: translateY(-3px); }
        .compliance-badges { display: flex; gap: 1.5rem; margin-top: 2rem; flex-wrap: wrap; }
        .comp-badge { display: flex; align-items: center; gap: .5rem; padding: .5rem 1rem; background: rgba(15,23,42,.1); border-radius: 8px; font-size: .85rem; color: var(--dark); border: 1px solid rgba(15,23,42,.2); }

        /* Newsletter */
        .newsletter-footer-section { background: linear-gradient(135deg, rgba(26,194,193,.1) 0%, rgba(26,194,193,.05) 100%); border-radius: 20px; padding: 40px; margin-bottom: 50px; border: 1px solid rgba(26,194,193,.2); position: relative; overflow: hidden; }
        .newsletter-footer-section::before { content: ''; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(26,194,193,.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .newsletter-icon-footer { width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.8rem; flex-shrink: 0; box-shadow: 0 8px 20px rgba(26,194,193,.3); }
        .newsletter-title { font-size: 1.5rem; font-weight: 700; color: var(--dark); margin-bottom: .25rem; }
        .newsletter-subtitle { color: var(--gray); font-size: .95rem; margin: 0; line-height: 1.5; }
        .newsletter-form-footer { width: 100%; position: relative; z-index: 2; }
        .input-group-wrapper { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
        .zf-tempContDiv { flex: 1; position: relative; margin: 0; padding: 0; }
        .newsletter-input { width: 100%; padding: 14px 20px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; color: var(--dark); background: #fff; transition: all .3s ease; min-width: 0; font-family: 'Inter', sans-serif; margin: 0; }
        .newsletter-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(26,194,193,.1); }
        .newsletter-input::placeholder { color: #94a3b8; }
        .zf-errorMessage { color: #ef4444; font-size: .85rem; margin-top: 6px; margin-bottom: 0; display: none; align-items: center; gap: 4px; font-weight: 500; }
        .zf-errorMessage::before { content: '\F332'; font-family: 'bootstrap-icons'; font-size: .8rem; }
        .newsletter-btn { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: #fff; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all .3s ease; display: flex; align-items: center; gap: 8px; white-space: nowrap; box-shadow: 0 4px 15px rgba(26,194,193,.3); font-family: 'Inter', sans-serif; height: fit-content; }
        .newsletter-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26,194,193,.4); }
        .newsletter-btn i { transition: transform .3s ease; }
        .newsletter-btn:hover i { transform: translateX(4px); }
        .newsletter-btn:disabled { opacity: .7; cursor: not-allowed; }
        .newsletter-disclaimer { color: var(--gray); font-size: .85rem; margin: 8px 0 0 0; display: flex; align-items: center; gap: 6px; }
        .newsletter-disclaimer i { color: var(--primary); }
        .zf-error { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
        .zf-success { border-color: #10b981 !important; background-color: #f0fdf4 !important; }
        .footer-main-content { margin-top: 20px; }
        .privacy-row { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: var(--gray); font-size: .9rem; }
        .privacy-link { color: var(--primary); text-decoration: none; transition: color .3s; }
        .privacy-link:hover { color: var(--primary-dark) !important; text-decoration: underline; }
        .privacy-separator { margin: 0 10px; color: #cbd5e1; }
        .footer-logo { width: 180px; height: auto; margin-bottom: 20px; }
        .footer-description { font-size: 14px; line-height: 1.6; max-width: 280px; color: var(--gray); }
        .footer-heading { color: #1a1a1a; font-size: 16px; font-weight: 600; margin-bottom: 20px; }
        .social-links { display: flex; justify-content: flex-end; gap: 15px; }
        .copyright { font-size: 14px; margin: 0; color: var(--gray); }

        @media (max-width: 991px) {
            .whatsapp-float { width: 55px; height: 55px; bottom: 20px; right: 20px; }
            .whatsapp-float i { font-size: 1.5rem; }
            .float-tooltip { display: none; }
            .newsletter-footer-section { padding: 30px; text-align: center; }
            .newsletter-footer-section .d-flex { flex-direction: column; text-align: center; }
            .newsletter-icon-footer { margin: 0 auto; }
            .input-group-wrapper { flex-direction: column; }
            .newsletter-btn { width: 100%; justify-content: center; }
            .social-links { justify-content: center; margin-top: 20px; }
            .copyright { text-align: center; }
        }
    </style>
</head>
<body>

    <script src="/components/site-header.js"></script>
    <site-header></site-header>

    <!-- If you want the "Support Dashboard" floating button here too, copy its <a> block from your blog page and paste it here -->

    <div class="single-post-view">
        <div class="container">
            <div class="text-center mb-4">
                <span class="post-category-single"><?= e($cat['name']) ?></span>
                <h1 class="post-title-single"><?= e($title) ?></h1>
                <div class="post-meta-single justify-content-center">
                    <span><i class="bi bi-calendar3"></i> <?= e(date('F j, Y', strtotime($date))) ?></span>
                    <span><i class="bi bi-clock"></i> <?= (int)$readTime ?> min read</span>
                </div>
            </div>

            <img src="<?= e($image) ?>" alt="<?= e($title) ?>" class="featured-image-single">

            <article class="post-content-single"><?= $content ?></article>

            <div class="blog-actions-section">
                <h3 class="blog-actions-title">
                    <i class="bi bi-share-fill" style="color: var(--primary);"></i> Share This Article
                </h3>
                <div class="blog-actions-grid">
                    <button class="action-btn action-btn-copy" onclick="copyBlogLink()"><i class="bi bi-link-45deg"></i> Copy Link</button>
                    <a class="action-btn action-btn-twitter" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=<?= $et ?>&url=<?= $eu ?>"><i class="bi bi-twitter-x"></i> Twitter</a>
                    <a class="action-btn action-btn-linkedin" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=<?= $eu ?>"><i class="bi bi-linkedin"></i> LinkedIn</a>
                    <a class="action-btn action-btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/?text=<?= $et ?>%20<?= $eu ?>"><i class="bi bi-whatsapp"></i> WhatsApp</a>
                    <a class="action-btn action-btn-share" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=<?= $eu ?>"><i class="bi bi-facebook"></i> Facebook</a>
                </div>
                <div class="copy-feedback" id="copyFeedback"><i class="bi bi-check-circle-fill"></i> Link copied to clipboard!</div>
            </div>

            <div class="text-center">
                <a class="btn-back" href="/resources/blog"><i class="bi bi-arrow-left"></i> Back to All Articles</a>
            </div>
        </div>

        <?php if ($related): ?>
        <section class="related-blogs-section">
            <div class="container">
                <h2 class="related-blogs-title"><span>Related</span> Articles</h2>
                <div class="row g-4">
                    <?php foreach ($related as $r):
                        $rt = html_entity_decode(strip_tags($r['title']['rendered']), ENT_QUOTES, 'UTF-8');
                        $rc = category_of($r);
                        $ri = image_of($r, 'https://via.placeholder.com/400x250/e0f7f7/1ac2c1?text=Verifitech');
                    ?>
                    <div class="col-md-4">
                        <a class="related-blog-card" href="/<?= e($r['slug']) ?>">
                            <div class="related-blog-image"><img src="<?= e($ri) ?>" alt="<?= e($rt) ?>" loading="lazy"></div>
                            <div class="related-blog-content">
                                <span class="related-blog-category"><?= e($rc['name']) ?></span>
                                <h4><?= e($rt) ?></h4>
                                <div class="related-blog-date"><i class="bi bi-calendar3"></i> <?= e(date('M j, Y', strtotime($r['date']))) ?></div>
                            </div>
                        </a>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>
    </div>

    <script src="/components/site-contact.js"></script>
    <site-contact></site-contact>

    <script src="/components/site-footer.js"></script>
    <site-footer></site-footer>

    <!-- Floating WhatsApp Button -->
    <a href="#" class="whatsapp-float" onclick="openWhatsApp(event)" style="position: fixed; bottom: 30px; right: 30px; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4); z-index: 9999; transition: all 0.3s ease; border: 3px solid rgba(255, 255, 255, 0.3); cursor: pointer;">
        <i class="bi bi-whatsapp" style="font-size: 1.8rem;"></i>
    </a>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function copyBlogLink() {
            const url = window.location.href;
            const done = () => {
                const f = document.getElementById('copyFeedback');
                f.classList.add('show');
                setTimeout(() => f.classList.remove('show'), 3000);
            };
            navigator.clipboard.writeText(url).then(done).catch(() => {
                const t = document.createElement('textarea');
                t.value = url; document.body.appendChild(t); t.select();
                document.execCommand('copy'); document.body.removeChild(t); done();
            });
        }
        function openWhatsApp(event) {
            event.preventDefault();
            const message = encodeURIComponent("Hi Verifitech Team, I'm interested in your services.\n\nCurrent page: " + window.location.href);
            window.open('https://wa.me/+919176663777?text=' + message, '_blank');
        }
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    </script>
</body>
</html>
