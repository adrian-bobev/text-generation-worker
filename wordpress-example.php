<?php
/**
 * WordPress Integration Example for Book Generation Worker
 * 
 * This file shows how to integrate the Cloudflare Worker into your WordPress site.
 * You can add this to your theme's functions.php or create a custom plugin.
 */

// =============================================================================
// Configuration
// =============================================================================

define('BOOK_WORKER_URL', 'https://book-generation-worker.YOUR_SUBDOMAIN.workers.dev');
define('BOOK_WORKER_API_KEY', ''); // Optional: Set if you configured API_KEY in worker

// =============================================================================
// AJAX Handler for Book Generation
// =============================================================================

/**
 * Register AJAX endpoints for both logged-in and non-logged-in users
 */
add_action('wp_ajax_generate_book', 'handle_generate_book_ajax');
add_action('wp_ajax_nopriv_generate_book', 'handle_generate_book_ajax');

function handle_generate_book_ajax() {
    // Verify nonce for security
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'book_generation_nonce')) {
        wp_send_json_error(['message' => 'Invalid security token'], 403);
        return;
    }

    // Validate input
    $name = sanitize_text_field($_POST['name'] ?? '');
    $age = intval($_POST['age'] ?? 0);
    $gender = sanitize_text_field($_POST['gender'] ?? '');
    $topic = sanitize_text_field($_POST['topic'] ?? '');

    if (empty($name) || empty($topic) || !in_array($gender, ['boy', 'girl']) || $age < 2 || $age > 10) {
        wp_send_json_error(['message' => 'Invalid input parameters'], 400);
        return;
    }

    // Call the Cloudflare Worker
    $result = generate_fairy_tale($name, $age, $gender, $topic);

    if (isset($result['error'])) {
        wp_send_json_error(['message' => $result['error']], 500);
    } else {
        wp_send_json_success($result);
    }
}

/**
 * Generate a fairy tale using the Cloudflare Worker
 */
function generate_fairy_tale($name, $age, $gender, $topic) {
    $data = [
        'name' => $name,
        'age' => $age,
        'gender' => $gender,
        'topic' => $topic,
        'model' => 'gemini-2.5-flash-lite'
    ];

    $headers = [
        'Content-Type' => 'application/json'
    ];

    // Add API key if configured
    if (defined('BOOK_WORKER_API_KEY') && !empty(BOOK_WORKER_API_KEY)) {
        $headers['X-API-Key'] = BOOK_WORKER_API_KEY;
    }

    $args = [
        'body' => json_encode($data),
        'headers' => $headers,
        'timeout' => 60, // Gemini can take 10-30 seconds
        'method' => 'POST',
        'sslverify' => true
    ];

    $response = wp_remote_post(BOOK_WORKER_URL, $args);

    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message()];
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if ($status_code !== 200) {
        return ['error' => $data['error'] ?? 'Unknown error occurred'];
    }

    return $data;
}

// =============================================================================
// Enqueue Scripts for Frontend
// =============================================================================

function enqueue_book_generation_scripts() {
    // Only load on pages that need it (adjust the condition as needed)
    if (!is_page('generate-book')) {
        return;
    }

    wp_enqueue_script(
        'book-generation',
        get_template_directory_uri() . '/js/book-generation.js',
        ['jquery'],
        '1.0.0',
        true
    );

    // Pass data to JavaScript
    wp_localize_script('book-generation', 'bookGenerationData', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('book_generation_nonce')
    ]);
}
add_action('wp_enqueue_scripts', 'enqueue_book_generation_scripts');

// =============================================================================
// Shortcode for Book Generation Form
// =============================================================================

function book_generation_form_shortcode() {
    ob_start();
    ?>
    <div id="book-generation-container">
        <form id="book-generation-form">
            <div class="form-group">
                <label for="child-name">Име на детето:</label>
                <input type="text" id="child-name" name="name" required maxlength="50">
            </div>

            <div class="form-group">
                <label for="child-age">Възраст:</label>
                <input type="number" id="child-age" name="age" min="2" max="10" required>
            </div>

            <div class="form-group">
                <label for="child-gender">Пол:</label>
                <select id="child-gender" name="gender" required>
                    <option value="">Избери...</option>
                    <option value="boy">Момче</option>
                    <option value="girl">Момиче</option>
                </select>
            </div>

            <div class="form-group">
                <label for="story-topic">Тема на приказката:</label>
                <input type="text" id="story-topic" name="topic" required maxlength="200" 
                       placeholder="напр. космос и звезди, приключения в гората...">
            </div>

            <button type="submit" id="generate-btn">Създай приказка</button>
        </form>

        <div id="loading-message" style="display: none;">
            <p>⏳ Създаваме вълшебна приказка... Моля, изчакайте 20-30 секунди.</p>
        </div>

        <div id="error-message" style="display: none;" class="error"></div>

        <div id="book-result" style="display: none;">
            <h2 id="book-title"></h2>
            <p id="book-description"></p>
            <div id="book-scenes"></div>
            <p id="book-motivation-end"></p>
        </div>
    </div>

    <style>
        #book-generation-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        #generate-btn {
            background: #0073aa;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        #generate-btn:hover {
            background: #005a87;
        }
        #generate-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
        }
        #loading-message {
            text-align: center;
            font-size: 18px;
            margin: 20px 0;
        }
    </style>
    <?php
    return ob_get_clean();
}
add_shortcode('book_generation_form', 'book_generation_form_shortcode');

// =============================================================================
// JavaScript for the form (save as js/book-generation.js in your theme)
// =============================================================================

/*
jQuery(document).ready(function($) {
    $('#book-generation-form').on('submit', function(e) {
        e.preventDefault();

        // Get form data
        var formData = {
            action: 'generate_book',
            nonce: bookGenerationData.nonce,
            name: $('#child-name').val(),
            age: $('#child-age').val(),
            gender: $('#child-gender').val(),
            topic: $('#story-topic').val()
        };

        // Show loading, hide results
        $('#loading-message').show();
        $('#error-message').hide();
        $('#book-result').hide();
        $('#generate-btn').prop('disabled', true);

        // Make AJAX request
        $.ajax({
            url: bookGenerationData.ajaxUrl,
            type: 'POST',
            data: formData,
            timeout: 60000, // 60 second timeout
            success: function(response) {
                if (response.success) {
                    displayBook(response.data);
                } else {
                    showError(response.data.message || 'Възникна грешка при създаването на приказката.');
                }
            },
            error: function(xhr, status, error) {
                if (status === 'timeout') {
                    showError('Заявката отне твърде дълго време. Моля, опитайте отново.');
                } else {
                    showError('Грешка при връзката със сървъра: ' + error);
                }
            },
            complete: function() {
                $('#loading-message').hide();
                $('#generate-btn').prop('disabled', false);
            }
        });
    });

    function displayBook(book) {
        $('#book-title').text(book.bookTitle);
        $('#book-description').text(book.shortDescription);
        $('#book-motivation-end').text(book.motivationEnd);

        var scenesHtml = '';
        book.scenes.forEach(function(scene, index) {
            scenesHtml += '<div class="scene">';
            scenesHtml += '<h4>Сцена ' + (index + 1) + '</h4>';
            scenesHtml += '<p>' + scene.text.replace(/\n\n/g, '</p><p>') + '</p>';
            scenesHtml += '</div>';
        });
        $('#book-scenes').html(scenesHtml);

        $('#book-result').fadeIn();
        $('html, body').animate({
            scrollTop: $('#book-result').offset().top - 100
        }, 500);
    }

    function showError(message) {
        $('#error-message').text(message).fadeIn();
    }
});
*/

