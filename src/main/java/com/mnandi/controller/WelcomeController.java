package com.mnandi.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class WelcomeController {

    @GetMapping("/")
    @ResponseBody
    public String welcome() {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Mnandi Flamed Grilled - Backend API</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            max-width: 900px;
                            margin: 50px auto;
                            padding: 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                        }
                        .container {
                            background: rgba(255, 255, 255, 0.95);
                            padding: 40px;
                            border-radius: 15px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                            color: #333;
                        }
                        h1 {
                            color: #764ba2;
                            border-bottom: 3px solid #667eea;
                            padding-bottom: 10px;
                        }
                        h2 {
                            color: #667eea;
                            margin-top: 30px;
                        }
                        .endpoint {
                            background: #f8f9fa;
                            padding: 15px;
                            margin: 10px 0;
                            border-radius: 8px;
                            border-left: 4px solid #667eea;
                        }
                        .method {
                            display: inline-block;
                            padding: 4px 10px;
                            border-radius: 4px;
                            font-weight: bold;
                            margin-right: 10px;
                            font-size: 12px;
                        }
                        .get { background: #28a745; color: white; }
                        .post { background: #007bff; color: white; }
                        .patch { background: #ffc107; color: #333; }
                        a {
                            color: #667eea;
                            text-decoration: none;
                            font-weight: 500;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        .status {
                            background: #28a745;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 25px;
                            display: inline-block;
                            margin: 20px 0;
                        }
                        code {
                            background: #e9ecef;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🔥 Mnandi Flamed Grilled - Backend API</h1>
                        <div class="status">✅ Server Status: RUNNING</div>
                        <p><strong>Version:</strong> 1.0.0 | <strong>Spring Boot:</strong> 3.4.2 | <strong>Java:</strong> 23</p>

                        <h2>📋 Menu Endpoints</h2>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/menu">/api/menu</a>
                            <p>Fetch all menu items from Google Sheets</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/menu/status">/api/menu/status</a>
                            <p>Get business hours and opening status</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/menu/health">/api/menu/health</a>
                            <p>Health check endpoint</p>
                        </div>

                        <h2>🛒 Order Endpoints</h2>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <code>/api/orders</code>
                            <p>Create a new order (requires JSON body)</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/orders">/api/orders</a>
                            <p>List all orders</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/api/orders/{confirmationNumber}</code>
                            <p>Track order by confirmation number</p>
                        </div>
                        <div class="endpoint">
                            <span class="method patch">PATCH</span>
                            <code>/api/orders/{id}/status</code>
                            <p>Update order status</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/orders/today">/api/orders/today</a>
                            <p>Get today's orders</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/orders/stats">/api/orders/stats</a>
                            <p>Get order statistics</p>
                        </div>

                        <h2>👥 Customer Endpoints</h2>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/customers">/api/customers</a>
                            <p>List all customers</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/api/customers/{id}</code>
                            <p>Get customer by ID</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/api/customers/phone/{phone}</code>
                            <p>Find customer by phone number</p>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/api/customers/stats">/api/customers/stats</a>
                            <p>Get customer analytics</p>
                        </div>

                        <h2>🗄️ Database Console</h2>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <a href="/h2-console">/h2-console</a>
                            <p>H2 Database Console (JDBC URL: <code>jdbc:h2:mem:mnandidb</code>, User: <code>sa</code>)</p>
                        </div>

                        <hr style="margin: 30px 0; border: 1px solid #dee2e6;">
                        <p style="text-align: center; color: #6c757d;">
                            💡 <strong>Tip:</strong> Click on the GET endpoints above to test them directly in your browser!
                        </p>
                    </div>
                </body>
                </html>
                """;
    }
}
