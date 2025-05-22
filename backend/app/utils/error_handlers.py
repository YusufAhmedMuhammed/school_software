from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Union, Dict, Any

class APIError(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = None,
        data: Dict[str, Any] = None
    ):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.data = data or {}

def setup_exception_handlers(app: FastAPI) -> None:
    """Setup custom exception handlers for the application"""

    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
        """Handle custom API errors"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code or "API_ERROR",
                    "message": exc.detail,
                    "data": exc.data
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle request validation errors"""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request data",
                    "data": {
                        "details": [
                            {
                                "loc": err["loc"],
                                "msg": err["msg"],
                                "type": err["type"]
                            }
                            for err in exc.errors()
                        ]
                    }
                }
            }
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle all other exceptions"""
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "data": {
                        "type": type(exc).__name__,
                        "detail": str(exc)
                    }
                }
            }
        ) 