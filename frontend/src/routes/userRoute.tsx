import { Routes,Route } from "react-router-dom"
import SignUpForm from "../pages/Signup"
import BulkImageUpload from "../pages/Home"

const userRoute = () => {
    return(
        <>
        <Routes>
            <Route>
             <Route path='/' element={<SignUpForm />} />
             <Route path='/home' element={<BulkImageUpload/>}/>
            </Route>
        </Routes>
        </>
    )
}


export default userRoute